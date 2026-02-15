import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { profileService, reviewService, scoringService, categoryService, socialAccountService, notificationService, adminActionLogService, featuredProfileService, collaborationService, ProfileFilters } from "./services/database";
import { storageService } from "./services/storage";
import { emailService } from "./services/email";
import { requireAuth, requireAdmin } from "./middleware/auth";


// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ============= CATEGORY & NICHE ROUTES =============

  // GET /api/categories - List all active categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await categoryService.getAll();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // GET /api/categories/:id/niches - List niches for a category
  app.get("/api/categories/:id/niches", async (req: Request, res: Response) => {
    try {
      const niches = await categoryService.getNichesByCategory(req.params.id);
      res.json(niches);
    } catch (error) {
      console.error("Error fetching niches:", error);
      res.status(500).json({ error: "Failed to fetch niches" });
    }
  });

  // GET /api/niches - List all niches (optional filter by category_id query param)
  app.get("/api/niches", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.category_id as string;
      const niches = categoryId
        ? await categoryService.getNichesByCategory(categoryId)
        : await categoryService.getAllNiches();
      res.json(niches);
    } catch (error) {
      console.error("Error fetching niches:", error);
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
      console.error("Error fetching social accounts:", error);
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
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // GET /api/profiles/user/:userId - Get all profiles for a user
  app.get("/api/profiles/user/:userId", async (req: Request, res: Response) => {
    try {
      const profiles = await profileService.getAllByUserId(req.params.userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // GET /api/profiles - List all approved profiles with filters
  app.get("/api/profiles", async (req: Request, res: Response) => {
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
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  // GET /api/profiles/:id - Get single profile by ID
  app.get("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      const profile = await profileService.getById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
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

      // Calculate initial Creasearch score
      await scoringService.updateProfileScore(profile.id);

      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      // @ts-ignore
      if (error && error.message) console.error("Error message:", error.message);
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

      // Recalculate Creasearch score after update
      await scoringService.updateProfileScore(profileId);

      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
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
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // ============= ADMIN ROUTES =============

  // GET /api/admin/pending
  app.get("/api/admin/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      // TODO: Add strict admin role check here. For now, requireAuth is a start.
      const profiles = await profileService.getPending();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching pending profiles:", error);
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

      emailService.sendProfileApprovedEmail(profile.user_id, profile.name)
        .catch(err => console.error('[Email] Failed to send approval email:', err));
      res.json(profile);
    } catch (error) {
      console.error("Error approving profile:", error);
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

      emailService.sendProfileRejectedEmail(profile.user_id, profile.name, reason)
        .catch(err => console.error('[Email] Failed to send rejection email:', err));
      res.json(profile);
    } catch (error) {
      console.error("Error rejecting profile:", error);
      res.status(500).json({ error: "Failed to reject profile" });
    }
  });

  // DELETE /api/admin/delete/:id
  app.delete("/api/admin/delete/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      // TODO: Verify user is admin
      const profileId = req.params.id;
      await profileService.delete(profileId);
      res.json({ success: true, message: "Profile deleted" });
    } catch (error) {
      console.error("Error deleting profile:", error);
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
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // POST /api/reviews - Create a new review (requires auth + approved profile)
  app.post("/api/reviews", requireAuth, async (req: Request, res: Response) => {
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
      console.error("Error creating review:", error);
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
  app.post("/api/upload/photo", requireAuth, upload.single('photo'), async (req: Request, res: Response) => {
    try {
      // Use verified user ID
      const userId = req.user.id;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const result = await storageService.uploadProfilePhoto(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({ success: true, url: result.url, path: result.path });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // POST /api/upload/video
  app.post("/api/upload/video", requireAuth, upload.single('video'), async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const result = await storageService.uploadVideoIntro(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({ success: true, url: result.url, path: result.path });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  // POST /api/verify/youtube - Verify YouTube channel and get subscriber count
  app.post("/api/verify/youtube", requireAuth, async (req: Request, res: Response) => {
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
      }

      res.json({
        success: result.status === 'VERIFIED',
        ...result
      });
    } catch (error) {
      console.error("Error verifying YouTube channel:", error);
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
        } : null
      };

      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ error: "Failed to fetch verification status" });
    }
  });

  // POST /api/verify/instagram - Queue Instagram verification (background processing)
  app.post("/api/verify/instagram", requireAuth, async (req: Request, res: Response) => {
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
      console.error("Error processing Instagram verification:", error);
      res.status(500).json({ error: "Failed to process Instagram verification" });
    }
  });

  // POST /api/admin/verify-instagram-now/:id - Admin: Force immediate Instagram verification
  app.post("/api/admin/verify-instagram-now/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const accounts = await socialAccountService.getByProfileId(req.params.id);
      const instagramAccount = accounts.find(a => a.platform === 'instagram');

      if (!instagramAccount) {
        return res.status(400).json({ error: "Profile has no Instagram link" });
      }

      const instagramUrl = instagramAccount.platform_url;

      const { verifyInstagramProfile } = await import("./services/instagram");
      const result = await verifyInstagramProfile(instagramUrl);

      if (result.status === 'VALIDATED') {
        await socialAccountService.updateVerification(req.params.id, 'instagram', {
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
      }

      res.json({
        success: result.status === 'VALIDATED',
        ...result
      });
    } catch (error) {
      console.error("Error verifying Instagram:", error);
      res.status(500).json({ error: "Failed to verify Instagram" });
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
      console.error("Error triggering YouTube refresh:", error);
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
      console.error("Error getting cron status:", error);
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
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // GET /api/notifications/unread-count - Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
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
      console.error("Error marking notification as read:", error);
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
      console.error("Error marking all notifications as read:", error);
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
      console.error("Error fetching admin action log:", error);
      res.status(500).json({ error: "Failed to fetch action log" });
    }
  });

  // ============================================
  // FEATURED PROFILES ROUTES
  // ============================================

  // GET /api/featured-profiles - Get featured profiles (public)
  app.get("/api/featured-profiles", async (req: Request, res: Response) => {
    try {
      const featured = await featuredProfileService.getAll();
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured profiles:", error);
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

      res.json(featured);
    } catch (error) {
      console.error("Error featuring profile:", error);
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

      res.json({ success: true });
    } catch (error) {
      console.error("Error unfeaturing profile:", error);
      res.status(500).json({ error: "Failed to unfeature profile" });
    }
  });

  // ============= COLLABORATION ROUTES =============

  // POST /api/collaborations - Submit a collaboration request
  app.post("/api/collaborations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { requester_profile_id, partner_profile_id, description, proof_url } = req.body;

      if (!requester_profile_id || !partner_profile_id || !description) {
        return res.status(400).json({ error: "Missing required fields: requester_profile_id, partner_profile_id, description" });
      }

      // Verify the requester owns the profile
      const requesterProfile = await profileService.getById(requester_profile_id);
      if (!requesterProfile || requesterProfile.user_id !== req.user.id) {
        return res.status(403).json({ error: "You can only submit collaborations from your own profile" });
      }

      // Verify the partner profile exists
      const partnerProfile = await profileService.getById(partner_profile_id);
      if (!partnerProfile) {
        return res.status(404).json({ error: "Partner profile not found" });
      }

      const collab = await collaborationService.create({
        requester_profile_id,
        partner_profile_id,
        description,
        proof_url: proof_url || null,
      });

      res.status(201).json(collab);
    } catch (error) {
      console.error("Error creating collaboration:", error);
      res.status(500).json({ error: "Failed to create collaboration request" });
    }
  });

  // GET /api/collaborations/profile/:id - Get collaborations for a profile
  app.get("/api/collaborations/profile/:id", async (req: Request, res: Response) => {
    try {
      const collabs = await collaborationService.getByProfileId(req.params.id);
      res.json(collabs);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
      res.status(500).json({ error: "Failed to fetch collaborations" });
    }
  });

  // GET /api/admin/collaborations/pending - Admin: get pending collaborations
  app.get("/api/admin/collaborations/pending", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const collabs = await collaborationService.getPending();
      res.json(collabs);
    } catch (error) {
      console.error("Error fetching pending collaborations:", error);
      res.status(500).json({ error: "Failed to fetch pending collaborations" });
    }
  });

  // PUT /api/admin/collaborations/:id/approve - Admin: approve collaboration
  app.put("/api/admin/collaborations/:id/approve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = req.user.id;
      const { admin_notes } = req.body;

      const collab = await collaborationService.approve(req.params.id, adminUserId, admin_notes);

      // Recalculate scores for both profiles
      await scoringService.updateProfileScore(collab.requester_profile_id);
      await scoringService.updateProfileScore(collab.partner_profile_id);

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'approve_collaboration',
        target_type: 'profile',
        target_id: req.params.id,
        details: { requester: collab.requester_profile_id, partner: collab.partner_profile_id }
      });

      // Send email notifications to both profiles
      const [requesterProfile, partnerProfile] = await Promise.all([
        profileService.getById(collab.requester_profile_id),
        profileService.getById(collab.partner_profile_id),
      ]);

      if (requesterProfile && partnerProfile) {
        emailService.sendCollaborationApprovedEmail(
          requesterProfile.user_id, requesterProfile.name, partnerProfile.name, collab.description
        ).catch(err => console.error('[Email] Failed to send collab approve email (requester):', err));

        emailService.sendCollaborationApprovedEmail(
          partnerProfile.user_id, partnerProfile.name, requesterProfile.name, collab.description
        ).catch(err => console.error('[Email] Failed to send collab approve email (partner):', err));
      }

      res.json(collab);
    } catch (error) {
      console.error("Error approving collaboration:", error);
      res.status(500).json({ error: "Failed to approve collaboration" });
    }
  });

  // PUT /api/admin/collaborations/:id/reject - Admin: reject collaboration
  app.put("/api/admin/collaborations/:id/reject", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = req.user.id;
      const { admin_notes } = req.body;

      const collab = await collaborationService.reject(req.params.id, adminUserId, admin_notes);

      // Log admin action
      await adminActionLogService.create({
        admin_user_id: adminUserId,
        action: 'reject_collaboration',
        target_type: 'profile',
        target_id: req.params.id,
        details: { requester: collab.requester_profile_id, partner: collab.partner_profile_id }
      });

      // Send email notification to requester
      const requesterProfile = await profileService.getById(collab.requester_profile_id);
      const partnerProfile = await profileService.getById(collab.partner_profile_id);

      if (requesterProfile && partnerProfile) {
        emailService.sendCollaborationRejectedEmail(
          requesterProfile.user_id, requesterProfile.name, partnerProfile.name, collab.description, admin_notes
        ).catch(err => console.error('[Email] Failed to send collab rejection email:', err));
      }

      res.json(collab);
    } catch (error) {
      console.error("Error rejecting collaboration:", error);
      res.status(500).json({ error: "Failed to reject collaboration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

