import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { profileService, reviewService, scoringService, categoryService, socialAccountService, notificationService, adminActionLogService, featuredProfileService, collaborationService, ProfileFilters } from "./services/database";
import { storageService } from "./services/storage";
import { emailService } from "./services/email";
import { requireAuth, requireAdmin } from "./middleware/auth";
import { logger } from "./utils/logger";
import { sensitiveRateLimit, verificationRateLimit } from "./middleware/rateLimit";
import { cacheMiddleware, invalidateCache } from "./middleware/cache";


// Configure multer for file uploads
const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow videos
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only videos are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ============= CATEGORY & NICHE ROUTES =============

  // GET /api/categories - List all active categories
  app.get("/api/categories", cacheMiddleware(300), async (req: Request, res: Response) => {
    try {
      const categories = await categoryService.getAll();
      res.json(categories);
    } catch (error) {
      logger.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // GET /api/categories/:id/niches - List niches for a category
  app.get("/api/categories/:id/niches", cacheMiddleware(300), async (req: Request, res: Response) => {
    try {
      const niches = await categoryService.getNichesByCategory(req.params.id);
      res.json(niches);
    } catch (error) {
      logger.error("Error fetching niches:", error);
      res.status(500).json({ error: "Failed to fetch niches" });
    }
  });

  // GET /api/niches - List all niches (optional filter by category_id query param)
  app.get("/api/niches", cacheMiddleware(300), async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.category_id as string;
      const niches = categoryId
        ? await categoryService.getNichesByCategory(categoryId)
        : await categoryService.getAllNiches();
      res.json(niches);
    } catch (error) {
      logger.error("Error fetching niches:", error);
      res.status(500).json({ error: "Failed to fetch niches" });
    }
  });

  // ============= SOCIAL ACCOUNT ROUTES =============

  // GET /api/profiles/:id/social-accounts - Get social accounts for a profile
  app.get("/api/profiles/:id/social-accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await socialAccountService.getByProfileId(req.params.id);
      res.json(accounts);
    } catch (error) {
      logger.error("Error fetching social accounts:", error);
      res.status(500).json({ error: "Failed to fetch social accounts" });
    }
  });

  // ============= PROFILE ROUTES =============

  // GET /api/profiles/me - Get current user's profile by user_id
  app.get("/api/profiles/me", async (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      const profileType = req.query.profile_type as string;
      if (!userId) {
        return res.status(400).json({ error: "user_id query parameter required" });
      }

      const profile = await profileService.getByUserId(userId, profileType);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found", exists: false });
      }
      res.json({ ...profile, exists: true });
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // GET /api/profiles/user/:userId - Get all profiles for a user
  app.get("/api/profiles/user/:userId", async (req: Request, res: Response) => {
    try {
      const profiles = await profileService.getAllByUserId(req.params.userId);
      res.json(profiles);
    } catch (error) {
      logger.error("Error fetching user profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // GET /api/profiles - List all approved profiles with filters
  app.get("/api/profiles", cacheMiddleware(300), async (req: Request, res: Response) => {
    try {
      const filters: ProfileFilters = {
        search: req.query.search as string,
        city: req.query.city as string,
        country: req.query.country as string,
        category_id: req.query.category_id as string,
        niche_id: req.query.niche_id as string,
        profile_type: req.query.profile_type as ProfileFilters['profile_type'],
        minFollowers: req.query.minFollowers ? parseInt(req.query.minFollowers as string) : undefined,
        maxFollowers: req.query.maxFollowers ? parseInt(req.query.maxFollowers as string) : undefined,
        collaborationType: req.query.collaborationType as string,
      };

      const profiles = await profileService.getAll(filters);
      res.json(profiles);
    } catch (error) {
      logger.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // GET /api/profiles/:id - Get single profile by ID
  app.get("/api/profiles/:id", cacheMiddleware(30), async (req: Request, res: Response) => {
    try {
      const profile = await profileService.getById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      logger.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // POST /api/profiles - Create new profile
  app.post("/api/profiles", requireAuth, async (req: Request, res: Response) => {
    try {

      // Use verified user ID from token
      const userId = req.user.id;

      const profileData = {
        ...req.body,
        user_id: userId, // Enforce checks
        status: 'pending' // Enforce status
      };

      const profile = await profileService.create(profileData);

      // Invalidate profile caches
      invalidateCache('/api/profiles');

      // Fire-and-forget: Calculate initial Creasearch score (non-blocking for faster response)
      scoringService.updateProfileScore(profile.id)
        .catch(err => logger.error('[Scoring] Failed to calculate initial score:', err));

      // Send "profile submitted" confirmation email
      emailService.sendProfileSubmittedEmail(userId, profile.name)
        .catch(err => logger.error('[Email] Failed to send profile submitted email:', err));

      res.status(201).json(profile);
    } catch (error) {
      logger.error("Error creating profile:", error);
      // @ts-ignore
      if (error && error.message) logger.error("Error message:", error.message);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // PUT /api/profiles/:id - Update profile
  app.put("/api/profiles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const profileId = req.params.id;
      const userId = req.user.id;

      // Verify ownership
      const existingProfile = await profileService.getById(profileId);
      if (!existingProfile) return res.status(404).json({ error: "Profile not found" });

      // Allow if user owns profile or is admin (TODO: implement robust admin check)
      if (existingProfile.user_id !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this profile" });
      }

      // If profile was rejected, allow resubmission as pending
      if (existingProfile.status === 'rejected' && req.body.status === 'pending') {
        req.body.status = 'pending';
      } else {
        // Don't allow users to change status otherwise
        delete req.body.status;
      }

      const profile = await profileService.update(profileId, req.body);

      // Invalidate profile caches
      invalidateCache('/api/profiles');

      // Recalculate Creasearch score after update (non-blocking)
      scoringService.updateProfileScore(profileId)
        .catch(err => logger.error('[Scoring] Failed to recalculate score:', err));

      res.json(profile);
    } catch (error) {
      logger.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // DELETE /api/profiles/:id - Delete profile
  app.delete("/api/profiles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const profileId = req.params.id;
      const userId = req.user.id;

      const existingProfile = await profileService.getById(profileId);
      if (!existingProfile) return res.status(404).json({ error: "Profile not found" });

      if (existingProfile.user_id !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this profile" });
      }

      await profileService.delete(profileId);
      invalidateCache('/api/profiles');
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // ============= ADMIN ROUTES =============

  // GET /api/admin/pending
  app.get("/api/admin/pending", requireAdmin, cacheMiddleware(30), async (req: Request, res: Response) => {
    try {
      // TODO: Add strict admin role check here. For now, requireAuth is a start.
      const profiles = await profileService.getPending();
      res.json(profiles);
    } catch (error) {
      logger.error("Error fetching pending profiles:", error);
      res.status(500).json({ error: "Failed to fetch pending profiles" });
    }
  });

  // POST /api/admin/approve/:id
  app.post("/api/admin/approve/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const profile = await profileService.approve(req.params.id);
      const adminUserId = (req as any).user.id;

      // Recalculate Creasearch score after approval
      await scoringService.updateProfileScore(profile.id);

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'approve_profile',
        target_type: 'profile',
        target_id: profile.id,
        details: {
          profile_name: profile.name,
          profile_type: profile.profile_type
        }
      });

      // Send in-app notification
      await notificationService.create({
        user_id: profile.user_id,
        type: 'profile_approved',
        title: 'Profile Approved!',
        message: `Your profile "${profile.name}" has been approved and is now live on Creasearch.`,
        metadata: { profile_id: profile.id }
      });

      // Invalidate caches
      invalidateCache('/api/admin/pending');
      invalidateCache('/api/profiles');
      invalidateCache('/api/notifications');

      emailService.sendProfileApprovedEmail(profile.user_id, profile.name)
        .catch(err => logger.error('[Email] Failed to send approval email:', err));
      res.json(profile);
    } catch (error) {
      logger.error("Error approving profile:", error);
      res.status(500).json({ error: "Failed to approve profile" });
    }
  });

  // POST /api/admin/reject/:id
  app.post("/api/admin/reject/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const profile = await profileService.reject(req.params.id);
      const adminUserId = (req as any).user.id;
      const { reason } = req.body; // Capture rejection reason if provided

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'reject_profile',
        target_type: 'profile',
        target_id: profile.id,
        details: {
          profile_name: profile.name,
          reason: reason || 'No reason provided'
        }
      });

      // Send in-app notification
      await notificationService.create({
        user_id: profile.user_id,
        type: 'profile_rejected',
        title: 'Profile Rejected',
        message: `Your profile "${profile.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
        metadata: { profile_id: profile.id, reason }
      });

      // Invalidate caches
      invalidateCache('/api/admin/pending');
      invalidateCache('/api/profiles');
      invalidateCache('/api/notifications');

      emailService.sendProfileRejectedEmail(profile.user_id, profile.name, reason)
        .catch(err => logger.error('[Email] Failed to send rejection email:', err));
      res.json(profile);
    } catch (error) {
      logger.error("Error rejecting profile:", error);
      res.status(500).json({ error: "Failed to reject profile" });
    }
  });

  // DELETE /api/admin/delete/:id
  app.delete("/api/admin/delete/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      // TODO: Verify user is admin
      const profileId = req.params.id;
      await profileService.delete(profileId);
      invalidateCache('/api/admin/pending');
      invalidateCache('/api/profiles');
      res.json({ success: true, message: "Profile deleted" });
    } catch (error) {
      logger.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // ============= REVIEWS ROUTES =============

  // GET /api/reviews/:profileId - Get all reviews for a profile (public)
  app.get("/api/reviews/:profileId", async (req: Request, res: Response) => {
    try {
      const reviews = await reviewService.getByProfileId(req.params.profileId);
      res.json(reviews);
    } catch (error) {
      logger.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // POST /api/reviews - Create a new review (requires auth + approved profile)
  app.post("/api/reviews", requireAuth, sensitiveRateLimit, async (req: Request, res: Response) => {
    try {
      const { profile_id, rating, comment } = req.body;
      const userId = req.user.id;

      if (!profile_id || !rating) {
        return res.status(400).json({ error: "profile_id and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const review = await reviewService.create({
        profile_id,
        reviewer_user_id: userId,
        rating,
        comment: comment || null
      });

      res.status(201).json(review);
    } catch (error: any) {
      logger.error("Error creating review:", error);
      // Return user-friendly error messages
      if (error.message.includes('Only verified users')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('cannot review your own')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('already reviewed')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // ============= AUTH ROUTES =============

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // ============= UPLOAD ROUTES =============

  // POST /api/upload/photo
  app.post("/api/upload/photo", requireAuth, uploadPhoto.single('photo'), async (req: Request, res: Response) => {
    try {
      // Use verified user ID
      const userId = req.user.id;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      // Validate magic bytes dynamically (handle ESM/CJS interop for file-type)
      const fileTypeMod = await import("file-type");
      const fromBufferFn = fileTypeMod.fromBuffer || fileTypeMod.default?.fromBuffer;
      const fileType = await fromBufferFn(file.buffer);
      if (!fileType || !fileType.mime.startsWith('image/')) {
        return res.status(400).json({ error: "Invalid file type detected by contents" });
      }

      // Sanitize original filename
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

      const result = await storageService.uploadProfilePhoto(
        userId,
        file.buffer,
        safeName,
        file.mimetype
      );

      res.json({ success: true, url: result.url, path: result.path });
    } catch (error) {
      logger.error("Error uploading photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // POST /api/upload/video
  app.post("/api/upload/video", requireAuth, uploadVideo.single('video'), async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      // Validate magic bytes dynamically (handle ESM/CJS interop for file-type)
      const fileTypeMod = await import("file-type");
      const fromBufferFn = fileTypeMod.fromBuffer || fileTypeMod.default?.fromBuffer;
      const fileType = await fromBufferFn(file.buffer);
      if (!fileType || !fileType.mime.startsWith('video/')) {
        return res.status(400).json({ error: "Invalid file type detected by contents" });
      }

      // Sanitize original filename
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

      const result = await storageService.uploadVideoIntro(
        userId,
        file.buffer,
        safeName,
        file.mimetype
      );

      res.json({ success: true, url: result.url, path: result.path });
    } catch (error) {
      logger.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // POST /api/verify/youtube - Verify YouTube channel and get subscriber count
  app.post("/api/verify/youtube", requireAuth, verificationRateLimit('youtube'), async (req: Request, res: Response) => {
    try {
      const { channelUrl, profileId } = req.body;

      if (!channelUrl) {
        return res.status(400).json({ error: "channelUrl is required" });
      }

      // Dynamic import to avoid loading googleapis on every request
      const { verifyYouTubeChannel } = await import("./services/youtube");
      const result = await verifyYouTubeChannel(channelUrl);

      // If profileId is provided, update the social_accounts table
      if (profileId && result.status === 'VERIFIED') {
        await socialAccountService.upsert(profileId, {
          platform: 'youtube',
          platform_url: channelUrl,
          platform_user_id: result.channelId,
          display_name: result.channelTitle,
          follower_count: result.subscribers || 0,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          raw_data: {
            channelId: result.channelId,
            channelTitle: result.channelTitle,
            subscribers: result.subscribers,
            status: result.status,
            lastUpdated: new Date().toISOString()
          }
        });

        // Send verification completion notification
        try {
          const profile = await profileService.getById(profileId);
          if (profile) {
            await notificationService.create({
              user_id: profile.user_id,
              type: 'verification_complete',
              title: 'YouTube Verification Complete',
              message: `Your YouTube channel "${result.channelTitle}" has been verified with ${result.subscribers?.toLocaleString() || 0} subscribers.`,
              metadata: { profile_id: profileId, platform: 'youtube', subscribers: result.subscribers }
            });
          }
        } catch (notifError) {
          logger.error('[Notification] Failed to send YouTube verification notification:', notifError);
        }
      }

      res.json({
        success: result.status === 'VERIFIED',
        ...result
      });
    } catch (error) {
      logger.error("Error verifying YouTube channel:", error);
      res.status(500).json({ error: "Failed to verify YouTube channel" });
    }
  });

  // GET /api/profiles/:id/verifications - Get verification status for all platforms
  app.get("/api/profiles/:id/verifications", async (req: Request, res: Response) => {
    try {
      const accounts = await socialAccountService.getByProfileId(req.params.id);
      if (!accounts) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const youtubeAccount = accounts.find(a => a.platform === 'youtube');
      const instagramAccount = accounts.find(a => a.platform === 'instagram');
      const facebookAccount = accounts.find(a => a.platform === 'facebook');

      const verifications = {
        youtube: youtubeAccount?.verification_status !== 'unverified' ? {
          status: youtubeAccount?.verification_status === 'verified' ? 'VERIFIED' : youtubeAccount?.verification_status?.toUpperCase(),
          subscribers: youtubeAccount?.follower_count || null,
          lastUpdated: youtubeAccount?.last_refreshed_at || youtubeAccount?.verified_at
        } : null,
        instagram: instagramAccount?.verification_status !== 'unverified' ? {
          status: instagramAccount?.verification_status === 'verified' ? 'VALIDATED' : instagramAccount?.verification_status?.toUpperCase(),
          followers: instagramAccount?.follower_count || null,
          lastUpdated: instagramAccount?.last_refreshed_at || instagramAccount?.verified_at
        } : null,
        facebook: facebookAccount?.verification_status !== 'unverified' ? {
          status: facebookAccount?.verification_status === 'verified' ? 'VALIDATED' : facebookAccount?.verification_status?.toUpperCase(),
          followers: facebookAccount?.follower_count || null,
          lastUpdated: facebookAccount?.last_refreshed_at || facebookAccount?.verified_at
        } : null
      };

      res.json(verifications);
    } catch (error) {
      logger.error("Error fetching verification status:", error);
      res.status(500).json({ error: "Failed to fetch verification status" });
    }
  });

  // POST /api/verify/instagram - Queue Instagram verification (background processing)
  app.post("/api/verify/instagram", requireAuth, verificationRateLimit('instagram'), async (req: Request, res: Response) => {
    try {
      const { profileUrl, profileId, immediate } = req.body;

      if (!profileUrl) {
        return res.status(400).json({ error: "profileUrl is required" });
      }

      // Dynamic import
      const { verifyInstagramProfile, extractInstagramUsername, queueInstagramVerification } =
        await import("./services/instagram");

      // If immediate verification is requested (admin use only, consumes quota)
      if (immediate) {
        const result = await verifyInstagramProfile(profileUrl);

        // Update social_accounts if profileId provided and verification succeeded
        if (profileId && result.status === 'VALIDATED') {
          await socialAccountService.upsert(profileId, {
            platform: 'instagram',
            platform_url: profileUrl,
            platform_username: result.username,
            display_name: result.fullName,
            follower_count: result.followers || 0,
            following_count: result.following || 0,
            post_count: result.posts || 0,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            raw_data: {
              username: result.username,
              followers: result.followers,
              following: result.following,
              posts: result.posts,
              fullName: result.fullName,
              status: result.status,
              lastUpdated: new Date().toISOString()
            }
          });

          // Send verification completion notification
          try {
            const profile = await profileService.getById(profileId);
            if (profile) {
              await notificationService.create({
                user_id: profile.user_id,
                type: 'verification_complete',
                title: 'Instagram Verification Complete',
                message: `Your Instagram account @${result.username} has been verified with ${result.followers?.toLocaleString() || 0} followers.`,
                metadata: { profile_id: profileId, platform: 'instagram', followers: result.followers }
              });
            }
          } catch (notifError) {
            logger.error('[Notification] Failed to send Instagram verification notification:', notifError);
          }
        }

        return res.json({
          success: result.status === 'VALIDATED',
          ...result
        });
      }

      // Default: Queue for background processing (respects quota limits)
      const username = extractInstagramUsername(profileUrl);

      // Mark as PENDING in social_accounts
      if (profileId) {
        await socialAccountService.upsert(profileId, {
          platform: 'instagram',
          platform_url: profileUrl,
          platform_username: username,
          verification_status: 'pending',
          raw_data: {
            queuedAt: new Date().toISOString()
          }
        });
      }

      const queueResult = await queueInstagramVerification(profileId || '', profileUrl);

      res.json({
        success: true,
        queued: queueResult.queued,
        message: queueResult.message,
        username,
        status: 'PENDING'
      });
    } catch (error) {
      logger.error("Error processing Instagram verification:", error);
      res.status(500).json({ error: "Failed to process Instagram verification" });
    }
  });

  // POST /api/verify/facebook - Queue Facebook verification (background processing)
  app.post("/api/verify/facebook", requireAuth, verificationRateLimit('facebook'), async (req: Request, res: Response) => {
    try {
      const { profileUrl, profileId, immediate } = req.body;

      if (!profileUrl) {
        return res.status(400).json({ error: "profileUrl is required" });
      }

      // Dynamic import
      const { verifyFacebookProfile, queueFacebookVerification } =
        await import("./services/facebook");

      // If immediate verification is requested
      if (immediate) {
        const result = await verifyFacebookProfile(profileUrl);

        if (profileId && result.status === 'VALIDATED') {
          await socialAccountService.upsert(profileId, {
            platform: 'facebook',
            platform_url: profileUrl,
            platform_username: result.pageName,
            display_name: result.pageName,
            follower_count: result.followers || 0,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            raw_data: {
              username: result.pageName,
              followers: result.followers,
              status: result.status,
              lastUpdated: new Date().toISOString()
            }
          });

          // Send verification completion notification
          try {
            const profile = await profileService.getById(profileId);
            if (profile) {
              await notificationService.create({
                user_id: profile.user_id,
                type: 'verification_complete',
                title: 'Facebook Verification Complete',
                message: `Your Facebook page "${result.pageName}" has been verified with ${result.followers?.toLocaleString() || 0} followers.`,
                metadata: { profile_id: profileId, platform: 'facebook', followers: result.followers }
              });
            }
          } catch (notifError) {
            logger.error('[Notification] Failed to send Facebook verification notification:', notifError);
          }
        }

        return res.json({
          success: result.status === 'VALIDATED',
          ...result
        });
      }

      // Default: Queue for background processing
      if (profileId) {
        await socialAccountService.upsert(profileId, {
          platform: 'facebook',
          platform_url: profileUrl,
          verification_status: 'pending',
          raw_data: {
            queuedAt: new Date().toISOString()
          }
        });
      }

      const queueResult = await queueFacebookVerification(profileId || '', profileUrl);

      res.json({
        success: true,
        queued: queueResult.queued,
        message: queueResult.message,
        url: profileUrl,
        status: 'PENDING'
      });
    } catch (error) {
      logger.error("Error processing Facebook verification:", error);
      res.status(500).json({ error: "Failed to process Facebook verification" });
    }
  });

  // POST /api/admin/verify-instagram-now/:id - Admin: Force immediate Instagram verification
  app.post("/api/admin/verify-instagram-now/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const profileId = req.params.id;
      const accounts = await socialAccountService.getByProfileId(profileId);
      const instagramAccount = accounts.find(a => a.platform === 'instagram');

      // Fallback to profiles.social_links if no social_accounts row exists
      let instagramUrl = instagramAccount?.platform_url;
      if (!instagramUrl) {
        const profile = await profileService.getById(profileId);
        instagramUrl = profile?.social_links?.instagram;
      }

      if (!instagramUrl) {
        return res.status(400).json({ error: "Profile has no Instagram link" });
      }

      const { verifyInstagramProfile } = await import("./services/instagram");
      const result = await verifyInstagramProfile(instagramUrl);

      if (result.status === 'VALIDATED') {
        // Use upsert to handle both existing and new social_accounts rows
        await socialAccountService.upsert(profileId, {
          platform: 'instagram',
          platform_url: instagramUrl,
          platform_username: result.username,
          display_name: result.fullName,
          follower_count: result.followers || 0,
          following_count: result.following || 0,
          post_count: result.posts || 0,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          raw_data: {
            username: result.username,
            followers: result.followers,
            following: result.following,
            posts: result.posts,
            fullName: result.fullName,
            status: result.status,
            lastUpdated: new Date().toISOString()
          }
        });

        // Send verification completion notification
        try {
          const profile = await profileService.getById(profileId);
          if (profile) {
            await notificationService.create({
              user_id: profile.user_id,
              type: 'verification_complete',
              title: 'Instagram Verification Complete',
              message: `Your Instagram account @${result.username} has been verified with ${result.followers?.toLocaleString() || 0} followers.`,
              metadata: { profile_id: profileId, platform: 'instagram', followers: result.followers }
            });
          }
        } catch (notifError) {
          logger.error('[Notification] Failed to send Instagram verification notification:', notifError);
        }
      }

      const isSuccess = result.status === 'VALIDATED';
      if (!isSuccess) {
        return res.status(502).json({
          success: false,
          warning: 'External verification API failed. The platform may be rate-limiting requests or the profile URL may be invalid.',
          ...result
        });
      }

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error("Error verifying Instagram:", error);
      res.status(500).json({ error: "Failed to verify Instagram" });
    }
  });

  // POST /api/admin/verify-facebook-now/:id - Admin: Force immediate Facebook verification
  app.post("/api/admin/verify-facebook-now/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const profileId = req.params.id;
      const accounts = await socialAccountService.getByProfileId(profileId);
      const facebookAccount = accounts.find(a => a.platform === 'facebook');

      // Fallback to profiles.social_links if no social_accounts row exists
      let facebookUrl = facebookAccount?.platform_url;
      if (!facebookUrl) {
        const profile = await profileService.getById(profileId);
        facebookUrl = profile?.social_links?.facebook;
      }

      if (!facebookUrl) {
        return res.status(400).json({ error: "Profile has no Facebook link" });
      }

      const { verifyFacebookProfile } = await import("./services/facebook");
      const result = await verifyFacebookProfile(facebookUrl);

      if (result.status === 'VALIDATED') {
        // Use upsert to handle both existing and new social_accounts rows
        await socialAccountService.upsert(profileId, {
          platform: 'facebook',
          platform_url: facebookUrl,
          platform_username: result.pageName,
          display_name: result.pageName,
          follower_count: result.followers || 0,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          raw_data: {
            username: result.pageName,
            followers: result.followers,
            status: result.status,
            pageName: result.pageName,
            lastUpdated: new Date().toISOString()
          }
        });

        // Send verification completion notification
        try {
          const profile = await profileService.getById(profileId);
          if (profile) {
            await notificationService.create({
              user_id: profile.user_id,
              type: 'verification_complete',
              title: 'Facebook Verification Complete',
              message: `Your Facebook page "${result.pageName}" has been verified with ${result.followers?.toLocaleString() || 0} followers.`,
              metadata: { profile_id: profileId, platform: 'facebook', followers: result.followers }
            });
          }
        } catch (notifError) {
          logger.error('[Notification] Failed to send Facebook verification notification:', notifError);
        }
      }

      const isSuccess = result.status === 'VALIDATED';
      if (!isSuccess) {
        return res.status(502).json({
          success: false,
          warning: 'External verification API failed. The platform may be rate-limiting requests or the profile URL may be invalid.',
          ...result
        });
      }

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error("Error verifying Facebook:", error);
      res.status(500).json({ error: "Failed to verify Facebook" });
    }
  });

  // POST /api/admin/refresh-youtube - Trigger manual YouTube refresh for all profiles
  app.post("/api/admin/refresh-youtube", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { triggerYouTubeRefresh } = await import("./services/cron");
      const result = await triggerYouTubeRefresh();
      res.json({
        success: true,
        message: `YouTube refresh complete: ${result.updated}/${result.total} profiles updated`,
        ...result
      });
    } catch (error) {
      logger.error("Error triggering YouTube refresh:", error);
      res.status(500).json({ error: "Failed to trigger YouTube refresh" });
    }
  });

  // GET /api/admin/cron-status - Get cron job status
  app.get("/api/admin/cron-status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { getCronStatus } = await import("./services/cron");
      const status = getCronStatus();
      res.json(status);
    } catch (error) {
      logger.error("Error getting cron status:", error);
      res.status(500).json({ error: "Failed to get cron status" });
    }
  });

  // ============================================
  // NOTIFICATION ROUTES
  // ============================================

  // GET /api/notifications - Get current user's notifications
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const notifications = await notificationService.getByUserId(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      logger.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // GET /api/notifications/unread-count - Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, cacheMiddleware(30), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      logger.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // PATCH /api/notifications/:id/read - Mark a notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await notificationService.markAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // PATCH /api/notifications/read-all - Mark all notifications as read
  app.patch("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // ============================================
  // ADMIN ACTION LOG ROUTES
  // ============================================

  // GET /api/admin/action-log - Get admin action log
  app.get("/api/admin/action-log", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await adminActionLogService.getAll(limit, offset);
      res.json(logs);
    } catch (error) {
      logger.error("Error fetching admin action log:", error);
      res.status(500).json({ error: "Failed to fetch action log" });
    }
  });

  // ============================================
  // FEATURED PROFILES ROUTES
  // ============================================

  // GET /api/featured-profiles - Get featured profiles (public)
  app.get("/api/featured-profiles", cacheMiddleware(120), async (req: Request, res: Response) => {
    try {
      const profileType = req.query.profile_type as 'creator' | 'organization' | undefined;
      const featured = await featuredProfileService.getAll(profileType);
      res.json(featured);
    } catch (error) {
      logger.error("Error fetching featured profiles:", error);
      res.status(500).json({ error: "Failed to fetch featured profiles" });
    }
  });

  // POST /api/admin/featured-profiles - Feature a profile (admin only)
  app.post("/api/admin/featured-profiles", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = (req as any).user.id;
      const { profile_id, sort_order, expires_at } = req.body;

      if (!profile_id) {
        return res.status(400).json({ error: "profile_id is required" });
      }

      const featured = await featuredProfileService.create({
        profile_id,
        featured_by: adminUserId,
        sort_order: sort_order || 0,
        expires_at
      });

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'feature_profile',
        target_type: 'profile',
        target_id: profile_id,
        details: { sort_order, expires_at }
      });

      // Notify the profile owner
      const profile = await profileService.getById(profile_id);
      if (profile) {
        await notificationService.create({
          user_id: profile.user_id,
          type: 'profile_featured',
          title: 'Your profile has been featured!',
          message: 'Congratulations! An admin has featured your profile on Creasearch.',
          metadata: { profile_id }
        });
      }

      invalidateCache('/api/featured-profiles');
      res.json(featured);
    } catch (error) {
      logger.error("Error featuring profile:", error);
      res.status(500).json({ error: "Failed to feature profile" });
    }
  });

  // DELETE /api/admin/featured-profiles/:profileId - Unfeature a profile (admin only)
  app.delete("/api/admin/featured-profiles/:profileId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = (req as any).user.id;
      await featuredProfileService.delete(req.params.profileId);

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'unfeature_profile',
        target_type: 'profile',
        target_id: req.params.profileId,
        details: {}
      });

      invalidateCache('/api/featured-profiles');
      res.json({ success: true });
    } catch (error) {
      logger.error("Error unfeaturing profile:", error);
      res.status(500).json({ error: "Failed to unfeature profile" });
    }
  });

  // ============================================
  // ADMIN CATEGORY & NICHE MANAGEMENT ROUTES
  // ============================================

  // GET /api/admin/categories - Get all categories (including inactive)
  app.get("/api/admin/categories", requireAdmin, async (req: Request, res: Response) => {
    try {
      const categories = await categoryService.getAllIncludingInactive();
      res.json(categories);
    } catch (error) {
      logger.error("Error fetching admin categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // POST /api/admin/categories - Create a new category
  app.post("/api/admin/categories", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, slug, sort_order } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ error: "name and slug are required" });
      }

      const category = await categoryService.createCategory({ name, slug, sort_order });

      await adminActionLogService.create({
        admin_user_id: (req as any).user.id,
        action: 'create_category',
        target_type: 'category',
        target_id: category.id,
        details: { name, slug }
      });

      res.status(201).json(category);
    } catch (error) {
      logger.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // PUT /api/admin/categories/:id - Update a category
  app.put("/api/admin/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, slug, sort_order, is_active } = req.body;
      const category = await categoryService.updateCategory(req.params.id, { name, slug, sort_order, is_active });

      await adminActionLogService.create({
        admin_user_id: (req as any).user.id,
        action: 'update_category',
        target_type: 'category',
        target_id: req.params.id,
        details: { name, slug, sort_order, is_active }
      });

      res.json(category);
    } catch (error) {
      logger.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // DELETE /api/admin/categories/:id - Soft-delete a category
  app.delete("/api/admin/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await categoryService.deleteCategory(req.params.id);

      await adminActionLogService.create({
        admin_user_id: (req as any).user.id,
        action: 'delete_category',
        target_type: 'category',
        target_id: req.params.id,
        details: {}
      });

      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // GET /api/admin/niches - Get all niches (including inactive), optional category_id filter
  app.get("/api/admin/niches", requireAdmin, async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.category_id as string | undefined;
      const niches = await categoryService.getAllNichesIncludingInactive(categoryId);
      res.json(niches);
    } catch (error) {
      logger.error("Error fetching admin niches:", error);
      res.status(500).json({ error: "Failed to fetch niches" });
    }
  });

  // POST /api/admin/niches - Create a new niche
  app.post("/api/admin/niches", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { category_id, name, slug, sort_order } = req.body;
      if (!category_id || !name || !slug) {
        return res.status(400).json({ error: "category_id, name, and slug are required" });
      }

      const niche = await categoryService.createNiche({ category_id, name, slug, sort_order });

      await adminActionLogService.create({
        admin_user_id: (req as any).user.id,
        action: 'create_niche',
        target_type: 'niche',
        target_id: niche.id,
        details: { category_id, name, slug }
      });

      res.status(201).json(niche);
    } catch (error) {
      logger.error("Error creating niche:", error);
      res.status(500).json({ error: "Failed to create niche" });
    }
  });

  // PUT /api/admin/niches/:id - Update a niche
  app.put("/api/admin/niches/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { category_id, name, slug, sort_order, is_active } = req.body;
      const niche = await categoryService.updateNiche(req.params.id, { category_id, name, slug, sort_order, is_active });

      await adminActionLogService.create({
        admin_user_id: (req as any).user.id,
        action: 'update_niche',
        target_type: 'niche',
        target_id: req.params.id,
        details: { category_id, name, slug, sort_order, is_active }
      });

      res.json(niche);
    } catch (error) {
      logger.error("Error updating niche:", error);
      res.status(500).json({ error: "Failed to update niche" });
    }
  });

  // DELETE /api/admin/niches/:id - Soft-delete a niche
  app.delete("/api/admin/niches/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await categoryService.deleteNiche(req.params.id);

      await adminActionLogService.create({
        admin_user_id: (req as any).user.id,
        action: 'delete_niche',
        target_type: 'niche',
        target_id: req.params.id,
        details: {}
      });

      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting niche:", error);
      res.status(500).json({ error: "Failed to delete niche" });
    }
  });

  // ============= COLLABORATION ROUTES =============

  // POST /api/collaborations - Submit a collaboration request
  app.post("/api/collaborations", requireAuth, sensitiveRateLimit, async (req: Request, res: Response) => {
    try {
      const {
        requester_profile_id, partner_profile_id, title, campaign_name,
        date_range, description, proof_url, proof_urls,
        is_external, external_partner_name, external_partner_url
      } = req.body;

      if (!requester_profile_id || !description) {
        return res.status(400).json({ error: "Missing required fields: requester_profile_id, description" });
      }

      // Proof is mandatory
      const allProofUrls = proof_urls || (proof_url ? [proof_url] : []);
      if (!allProofUrls || allProofUrls.length === 0) {
        return res.status(400).json({ error: "At least one proof URL is required" });
      }

      // For internal collabs, partner_profile_id is required
      if (!is_external && !partner_profile_id) {
        return res.status(400).json({ error: "partner_profile_id is required for internal collaborations" });
      }

      // For external collabs, external_partner_name is required
      if (is_external && !external_partner_name) {
        return res.status(400).json({ error: "external_partner_name is required for external collaborations" });
      }

      // Verify the requester owns the profile
      const requesterProfile = await profileService.getById(requester_profile_id);
      if (!requesterProfile || requesterProfile.user_id !== req.user.id) {
        return res.status(403).json({ error: "You can only submit collaborations from your own profile" });
      }

      // Verify the partner profile exists (only for internal collabs)
      let partnerProfile = null;
      if (!is_external && partner_profile_id) {
        partnerProfile = await profileService.getById(partner_profile_id);
        if (!partnerProfile) {
          return res.status(404).json({ error: "Partner profile not found" });
        }
      }

      // Duplicate detection
      const isDuplicate = await collaborationService.checkDuplicate(
        requester_profile_id,
        is_external ? null : partner_profile_id,
        campaign_name || null
      );
      if (isDuplicate) {
        return res.status(409).json({ error: "A collaboration with the same partner and campaign already exists" });
      }

      const collab = await collaborationService.create({
        requester_profile_id,
        partner_profile_id: is_external ? null : partner_profile_id,
        title: title || null,
        campaign_name: campaign_name || null,
        date_range: date_range || null,
        description,
        proof_url: proof_url || null,
        proof_urls: allProofUrls,
        is_external: is_external || false,
        external_partner_name: external_partner_name || null,
        external_partner_url: external_partner_url || null,
      });

      // Send notification to partner for internal collabs
      if (!is_external && partnerProfile) {
        await notificationService.create({
          user_id: partnerProfile.user_id,
          type: 'new_inquiry',
          title: 'New Collaboration Request',
          message: `${requesterProfile.name} has submitted a collaboration request "${title || description}". Please confirm or reject it.`,
          metadata: { collaboration_id: collab.id, requester_profile_id }
        });
      }

      res.status(201).json(collab);
    } catch (error) {
      logger.error("Error creating collaboration:", error);
      res.status(500).json({ error: "Failed to create collaboration request" });
    }
  });

  // GET /api/collaborations/my - Get current user's collaborations (across all profiles)
  app.get("/api/collaborations/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const collabs = await collaborationService.getByUserId(userId);
      res.json(collabs);
    } catch (error) {
      logger.error("Error fetching user collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

  // GET /api/collaborations/pending-confirmation - Get collabs awaiting user's confirmation
  app.get("/api/collaborations/pending-confirmation", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const collabs = await collaborationService.getPendingConfirmationForUser(userId);
      res.json(collabs);
    } catch (error) {
      logger.error("Error fetching pending confirmations:", error);
      res.status(500).json({ error: "Failed to fetch pending confirmations" });
    }
  });

  // GET /api/collaborations/profile/:id - Get collaborations for a profile
  app.get("/api/collaborations/profile/:id", async (req: Request, res: Response) => {
    try {
      const collabs = await collaborationService.getByProfileId(req.params.id);
      res.json(collabs);
    } catch (error) {
      logger.error("Error fetching collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

  // PUT /api/collaborations/:id/confirm - Partner confirms collaboration
  app.put("/api/collaborations/:id/confirm", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const collab = await collaborationService.confirmByPartner(req.params.id, userId);

      // Notify the requester that partner confirmed
      const requesterProfile = await profileService.getById(collab.requester_profile_id);
      if (requesterProfile) {
        await notificationService.create({
          user_id: requesterProfile.user_id,
          type: 'new_inquiry',
          title: 'Collaboration Confirmed',
          message: `Your collaboration request "${collab.title || collab.description}" has been confirmed by your partner and is now awaiting admin review.`,
          metadata: { collaboration_id: collab.id }
        });
      }

      res.json(collab);
    } catch (error: any) {
      logger.error("Error confirming collaboration:", error);
      if (error.message.includes('not the partner') || error.message.includes('not pending')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to confirm collaboration" });
    }
  });

  // PUT /api/collaborations/:id/reject-partner - Partner rejects collaboration
  app.put("/api/collaborations/:id/reject-partner", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const collab = await collaborationService.rejectByPartner(req.params.id, userId);

      // Notify the requester that partner rejected
      const requesterProfile = await profileService.getById(collab.requester_profile_id);
      if (requesterProfile) {
        await notificationService.create({
          user_id: requesterProfile.user_id,
          type: 'new_inquiry',
          title: 'Collaboration Rejected',
          message: `Your collaboration request "${collab.title || collab.description}" was rejected by the partner.`,
          metadata: { collaboration_id: collab.id }
        });
      }

      res.json(collab);
    } catch (error: any) {
      logger.error("Error rejecting collaboration by partner:", error);
      if (error.message.includes('not the partner') || error.message.includes('not pending')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to reject collaboration" });
    }
  });

  // GET /api/admin/collaborations/pending - Admin: get pending collaborations
  app.get("/api/admin/collaborations/pending", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const collabs = await collaborationService.getPending();
      res.json(collabs);
    } catch (error) {
      logger.error("Error fetching pending collaborations:", error);
      res.status(500).json({ error: "Failed to fetch pending collaborations" });
    }
  });

  // GET /api/admin/collaborations - Admin: get all collaborations
  app.get("/api/admin/collaborations", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const collabs = await collaborationService.getAll();
      res.json(collabs);
    } catch (error) {
      logger.error("Error fetching all collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

  // PUT /api/admin/collaborations/:id/approve - Admin: approve collaboration
  app.put("/api/admin/collaborations/:id/approve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = req.user.id;
      const { admin_notes } = req.body;

      const collab = await collaborationService.approve(req.params.id, adminUserId, admin_notes);

      // Perform non-dependent operations in parallel
      const requesterProfilePromise = profileService.getById(collab.requester_profile_id);
      const partnerProfilePromise = collab.partner_profile_id ? profileService.getById(collab.partner_profile_id) : Promise.resolve(null);

      const scoreUpdates = [
        scoringService.updateProfileScore(collab.requester_profile_id)
      ];
      if (collab.partner_profile_id) {
        scoreUpdates.push(scoringService.updateProfileScore(collab.partner_profile_id));
      }

      // Parallelize profile fetching and score updates
      const [requesterProfile, partnerProfile] = await Promise.all([
        requesterProfilePromise,
        partnerProfilePromise,
        ...scoreUpdates
      ]);

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'approve_collaboration',
        target_type: 'collaboration',
        target_id: collab.id,
        details: {
          requester: collab.requester_profile_id,
          partner: collab.partner_profile_id,
          is_external: collab.is_external,
          external_partner_name: collab.external_partner_name
        }
      });

      // Send notifications to both parties
      if (requesterProfile) {
        const partnerDisplayName = collab.is_external
          ? (collab.external_partner_name || 'External Partner')
          : (partnerProfile?.name || 'Partner');

        await notificationService.create({
          user_id: requesterProfile.user_id,
          type: 'profile_approved',
          title: 'Collaboration Approved!',
          message: `Your collaboration "${collab.title || collab.description}" with ${partnerDisplayName} has been verified and approved.`,
          metadata: { collaboration_id: collab.id }
        });

        emailService.sendCollaborationApprovedEmail(
          requesterProfile.user_id, requesterProfile.name, partnerDisplayName, collab.description
        ).catch(err => logger.error('[Email] Failed to send collab approve email (requester):', err));
      }

      if (partnerProfile && requesterProfile) {
        await notificationService.create({
          user_id: partnerProfile.user_id,
          type: 'profile_approved',
          title: 'Collaboration Approved!',
          message: `Your collaboration "${collab.title || collab.description}" with ${requesterProfile.name} has been verified and approved.`,
          metadata: { collaboration_id: collab.id }
        });

        emailService.sendCollaborationApprovedEmail(
          partnerProfile.user_id, partnerProfile.name, requesterProfile.name, collab.description
        ).catch(err => logger.error('[Email] Failed to send collab approve email (partner):', err));
      }

      res.json(collab);
    } catch (error) {
      logger.error("Error approving collaboration:", error);
      res.status(500).json({ error: "Failed to approve collaboration" });
    }
  });

  // PUT /api/admin/collaborations/:id/reject - Admin: reject collaboration
  app.put("/api/admin/collaborations/:id/reject", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = req.user.id;
      const { admin_notes } = req.body;

      const collab = await collaborationService.reject(req.params.id, adminUserId, admin_notes);

      // Fetch profiles in parallel for notification
      const requesterProfilePromise = profileService.getById(collab.requester_profile_id);
      const partnerProfilePromise = collab.partner_profile_id ? profileService.getById(collab.partner_profile_id) : Promise.resolve(null);

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'reject_collaboration',
        target_type: 'collaboration',
        target_id: collab.id,
        details: {
          requester: collab.requester_profile_id,
          partner: collab.partner_profile_id,
          is_external: collab.is_external,
          external_partner_name: collab.external_partner_name
        }
      });

      const [requesterProfile, partnerProfile] = await Promise.all([requesterProfilePromise, partnerProfilePromise]);

      // Send notification to requester
      if (requesterProfile) {
        const partnerDisplayName = collab.is_external
          ? (collab.external_partner_name || 'External Partner')
          : (partnerProfile?.name || 'Partner');

        await notificationService.create({
          user_id: requesterProfile.user_id,
          type: 'profile_rejected',
          title: 'Collaboration Rejected',
          message: `Your collaboration "${collab.title || collab.description}" with ${partnerDisplayName} was not approved.${admin_notes ? ` Reason: ${admin_notes}` : ''}`,
          metadata: { collaboration_id: collab.id, reason: admin_notes }
        });

        emailService.sendCollaborationRejectedEmail(
          requesterProfile.user_id, requesterProfile.name, partnerDisplayName, collab.description, admin_notes
        ).catch(err => logger.error('[Email] Failed to send collab rejection email:', err));
      }

      res.json(collab);
    } catch (error) {
      logger.error("Error rejecting collaboration:", error);
      res.status(500).json({ error: "Failed to reject collaboration" });
    }
  });

  // POST /api/admin/collaborations - Admin: create a collaboration on behalf of a user
  app.post("/api/admin/collaborations", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = req.user.id;
      const {
        requester_profile_id, partner_profile_id, title, campaign_name,
        date_range, description, proof_url, proof_urls,
        is_external, external_partner_name, external_partner_url, auto_approve
      } = req.body;

      if (!requester_profile_id || !description) {
        return res.status(400).json({ error: "Missing required fields: requester_profile_id, description" });
      }

      if (is_external && !external_partner_name) {
        return res.status(400).json({ error: "external_partner_name is required for external collaborations" });
      }

      if (!is_external && !partner_profile_id) {
        return res.status(400).json({ error: "partner_profile_id is required for internal collaborations" });
      }

      // Verify the requester profile exists
      const requesterProfile = await profileService.getById(requester_profile_id);
      if (!requesterProfile) {
        return res.status(404).json({ error: "Requester profile not found" });
      }

      const allProofUrls = proof_urls || (proof_url ? [proof_url] : []);

      const collab = await collaborationService.create({
        requester_profile_id,
        partner_profile_id: is_external ? null : partner_profile_id,
        title: title || null,
        campaign_name: campaign_name || null,
        date_range: date_range || null,
        description,
        proof_url: proof_url || null,
        proof_urls: allProofUrls,
        is_external: is_external || false,
        external_partner_name: external_partner_name || null,
        external_partner_url: external_partner_url || null,
      });

      // Auto-approve if requested
      if (auto_approve) {
        const approvedCollab = await collaborationService.approve(collab.id, adminUserId, 'Admin-created and auto-approved');

        await scoringService.updateProfileScore(approvedCollab.requester_profile_id);
        if (approvedCollab.partner_profile_id) {
          await scoringService.updateProfileScore(approvedCollab.partner_profile_id);
        }

        await adminActionLogService.create({
          admin_user_id: adminUserId,
          action: 'admin_create_collaboration',
          target_type: 'collaboration',
          target_id: collab.id,
          details: {
            requester: requester_profile_id,
            partner: partner_profile_id,
            is_external,
            external_partner_name,
            auto_approved: true
          }
        });

        return res.status(201).json(approvedCollab);
      }

      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'admin_create_collaboration',
        target_type: 'collaboration',
        target_id: collab.id,
        details: {
          requester: requester_profile_id,
          partner: partner_profile_id,
          is_external,
          external_partner_name
        }
      });

      res.status(201).json(collab);
    } catch (error) {
      logger.error("Error creating admin collaboration:", error);
      res.status(500).json({ error: "Failed to create collaboration" });
    }
  });
  // ============= VERIFICATION QUEUE ADMIN ROUTES =============

  // GET /api/admin/verification-queue/stats - Get queue stats
  app.get("/api/admin/verification-queue/stats", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { verificationQueueService } = await import('./services/verification-queue');
      const stats = await verificationQueueService.getQueueStats();
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching queue stats:", error);
      res.status(500).json({ error: "Failed to fetch queue stats" });
    }
  });

  // GET /api/admin/verification-queue/items - Get recent queue items
  app.get("/api/admin/verification-queue/items", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { verificationQueueService } = await import('./services/verification-queue');
      const limit = parseInt(req.query.limit as string) || 20;
      const items = await verificationQueueService.getRecentItems(limit);
      res.json(items);
    } catch (error) {
      logger.error("Error fetching queue items:", error);
      res.status(500).json({ error: "Failed to fetch queue items" });
    }
  });

  // POST /api/admin/verification-queue/:id/retry - Admin retry a task
  app.post("/api/admin/verification-queue/:id/retry", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { verificationQueueService } = await import('./services/verification-queue');
      const item = await verificationQueueService.adminRetry(req.params.id);
      res.json(item);
    } catch (error) {
      logger.error("Error retrying queue task:", error);
      res.status(500).json({ error: "Failed to retry task" });
    }
  });

  // POST /api/admin/verification-queue/process - Manually trigger queue processing
  app.post("/api/admin/verification-queue/process", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { verificationQueueService } = await import('./services/verification-queue');
      const platform = req.body.platform;
      const stats = await verificationQueueService.processQueue(platform, 3);
      res.json(stats);
    } catch (error) {
      logger.error("Error processing queue:", error);
      res.status(500).json({ error: "Failed to process queue" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

