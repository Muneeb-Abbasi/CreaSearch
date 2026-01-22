import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { profileService, ProfileFilters } from "./services/database";
import { storageService } from "./services/storage";
import { emailService } from "./services/email";

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
  app.post("/api/profiles", async (req: Request, res: Response) => {
    try {
      // TODO: Add auth middleware to get user_id from session
      const profile = await profileService.create(req.body);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // PUT /api/profiles/:id - Update profile
  app.put("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      // TODO: Add auth check - only owner can update
      const profile = await profileService.update(req.params.id, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // DELETE /api/profiles/:id - Delete profile
  app.delete("/api/profiles/:id", async (req: Request, res: Response) => {
    try {
      // TODO: Add auth check - only owner or admin can delete
      await profileService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // ============= ADMIN ROUTES =============

  // GET /api/admin/pending - Get pending profiles for approval
  app.get("/api/admin/pending", async (req: Request, res: Response) => {
    try {
      // TODO: Add admin auth check
      const profiles = await profileService.getPending();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching pending profiles:", error);
      res.status(500).json({ error: "Failed to fetch pending profiles" });
    }
  });

  // POST /api/admin/approve/:id - Approve a profile
  app.post("/api/admin/approve/:id", async (req: Request, res: Response) => {
    try {
      // TODO: Add admin auth check
      const profile = await profileService.approve(req.params.id);

      // Send approval email (non-blocking)
      emailService.sendProfileApprovedEmail(profile.user_id, profile.name)
        .catch(err => console.error('[Email] Failed to send approval email:', err));

      res.json(profile);
    } catch (error) {
      console.error("Error approving profile:", error);
      res.status(500).json({ error: "Failed to approve profile" });
    }
  });

  // POST /api/admin/reject/:id - Reject a profile
  app.post("/api/admin/reject/:id", async (req: Request, res: Response) => {
    try {
      // TODO: Add admin auth check
      const profile = await profileService.reject(req.params.id);

      // Send rejection email (non-blocking)
      emailService.sendProfileRejectedEmail(profile.user_id, profile.name)
        .catch(err => console.error('[Email] Failed to send rejection email:', err));

      res.json(profile);
    } catch (error) {
      console.error("Error rejecting profile:", error);
      res.status(500).json({ error: "Failed to reject profile" });
    }
  });

  // DELETE /api/admin/delete/:id - Delete a profile (admin only)
  app.delete("/api/admin/delete/:id", async (req: Request, res: Response) => {
    try {
      const profileId = req.params.id;
      console.log(`[DELETE] Attempting to delete profile: ${profileId}`);

      // TODO: Add admin auth check
      await profileService.delete(profileId);

      console.log(`[DELETE] Successfully deleted profile: ${profileId}`);
      res.json({ success: true, message: "Profile deleted" });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  // ============= AUTH ROUTES =============

  // GET /api/auth/me - Get current user (placeholder)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    // TODO: Implement with Supabase Auth
    res.json({ user: null, message: "Auth not yet implemented" });
  });

  // ============= UPLOAD ROUTES =============

  // POST /api/upload/photo - Upload profile photo
  app.post("/api/upload/photo", upload.single('photo'), async (req: Request, res: Response) => {
    try {
      const userId = req.body.user_id;
      const file = req.file;

      if (!userId) {
        return res.status(400).json({ error: "user_id is required" });
      }

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Supabase Storage
      const result = await storageService.uploadProfilePhoto(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({
        success: true,
        url: result.url,
        path: result.path
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // POST /api/upload/video - Upload video intro
  app.post("/api/upload/video", upload.single('video'), async (req: Request, res: Response) => {
    try {
      const userId = req.body.user_id;
      const file = req.file;

      if (!userId) {
        return res.status(400).json({ error: "user_id is required" });
      }

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Supabase Storage
      const result = await storageService.uploadVideoIntro(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({
        success: true,
        url: result.url,
        path: result.path
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

