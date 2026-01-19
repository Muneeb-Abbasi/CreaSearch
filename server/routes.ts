import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { profileService, ProfileFilters } from "./services/database";

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
      res.json(profile);
    } catch (error) {
      console.error("Error rejecting profile:", error);
      res.status(500).json({ error: "Failed to reject profile" });
    }
  });

  // ============= AUTH ROUTES =============

  // GET /api/auth/me - Get current user (placeholder)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    // TODO: Implement with Supabase Auth
    res.json({ user: null, message: "Auth not yet implemented" });
  });

  const httpServer = createServer(app);
  return httpServer;
}

