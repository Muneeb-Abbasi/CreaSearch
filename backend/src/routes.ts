import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { profileService, ProfileFilters } from "./services/database";
import { storageService } from "./services/storage";
import { emailService } from "./services/email";
import { requireAuth } from "./middleware/auth";

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
  // ============= PROFILE ROUTES =============

  // GET /api/profiles/me - Get current user's profile by user_id
  app.get("/api/profiles/me", async (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      if (!userId) {
        return res.status(400).json({ error: "user_id query parameter required" });
      }

      const profile = await profileService.getByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found", exists: false });
      }
      res.json({ ...profile, exists: true });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // GET /api/profiles - List all approved profiles with filters
  app.get("/api/profiles", async (req: Request, res: Response) => {
    try {
      const filters: ProfileFilters = {
        search: req.query.search as string,
        city: req.query.city as string,
        country: req.query.country as string,
        industry: req.query.industry as string,
        niche: req.query.niche as string,
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
      console.log("[POST] /api/profiles - Payload:", JSON.stringify(req.body));

      // Use verified user ID from token
      const userId = req.user.id;

      const profileData = {
        ...req.body,
        user_id: userId, // Enforce checks
        status: 'pending' // Enforce status
      };

      const profile = await profileService.create(profileData);
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

      const profile = await profileService.update(profileId, req.body);
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
  app.get("/api/admin/pending", requireAuth, async (req: Request, res: Response) => {
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
  app.post("/api/admin/approve/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const profile = await profileService.approve(req.params.id);
      emailService.sendProfileApprovedEmail(profile.user_id, profile.name)
        .catch(err => console.error('[Email] Failed to send approval email:', err));
      res.json(profile);
    } catch (error) {
      console.error("Error approving profile:", error);
      res.status(500).json({ error: "Failed to approve profile" });
    }
  });

  // POST /api/admin/reject/:id
  app.post("/api/admin/reject/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const profile = await profileService.reject(req.params.id);
      emailService.sendProfileRejectedEmail(profile.user_id, profile.name)
        .catch(err => console.error('[Email] Failed to send rejection email:', err));
      res.json(profile);
    } catch (error) {
      console.error("Error rejecting profile:", error);
      res.status(500).json({ error: "Failed to reject profile" });
    }
  });

  // DELETE /api/admin/delete/:id
  app.delete("/api/admin/delete/:id", requireAuth, async (req: Request, res: Response) => {
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

  // ============= VERIFICATION ROUTES =============

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

      // If profileId is provided, update the profile's social_links
      if (profileId && result.status === 'VERIFIED') {
        const profile = await profileService.getById(profileId);
        if (profile) {
          const updatedSocialLinks = {
            ...profile.social_links,
            youtube: {
              url: channelUrl,
              channelId: result.channelId,
              channelTitle: result.channelTitle,
              subscribers: result.subscribers,
              status: result.status,
              lastUpdated: new Date().toISOString()
            }
          };
          await profileService.update(profileId, { social_links: updatedSocialLinks });
        }
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
      const profile = await profileService.getById(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const verifications = {
        youtube: profile.social_links?.youtube?.status ? {
          status: profile.social_links.youtube.status,
          subscribers: profile.social_links.youtube.subscribers,
          lastUpdated: profile.social_links.youtube.lastUpdated
        } : null,
        instagram: profile.social_links?.instagram?.status ? {
          status: profile.social_links.instagram.status,
          followers: profile.social_links.instagram.followers,
          lastUpdated: profile.social_links.instagram.lastUpdated
        } : null
      };

      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ error: "Failed to fetch verification status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

