import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Profile creation schema
export const profileCreateSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .trim()
    .refine((val) => !/\d/.test(val), "Name cannot contain numbers")
    .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), "Name can only contain letters, spaces, hyphens, and apostrophes"),
  title: z.string().max(200, "Title too long").trim().nullable().optional(),
  profile_type: z.enum(['creator', 'organization']).optional(),
  category_id: z.string().uuid("Invalid category").nullable().optional(),
  niche_id: z.string().uuid("Invalid niche").nullable().optional(),
  city: z.string().min(1, "City is required").max(100, "City name too long").trim(),
  country: z.string().length(2, "Country code is required"),
  phone: z.string()
    .min(10, "Phone number is required")
    .max(20, "Phone number too long")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  bio: z.string().max(2000, "Bio too long").trim().nullable().optional(),
  follower_total: z.number().int().min(0).max(100000000).optional(),
  collaboration_types: z.array(z.string().max(50)).max(10).optional(),
  avatar_url: z.string().url("Invalid URL").nullable().optional(),
  video_intro_url: z.string().url("Invalid URL").nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  // Deprecated fields - accepted for backward compatibility
  role: z.enum(['creator', 'organization', 'admin']).optional(),
  industry: z.string().max(100).trim().optional(),
  niche: z.string().max(100).trim().optional(),
  location: z.string().max(200).trim().nullable().optional(),
  social_links: z.record(z.any()).optional(),
});

// Profile update schema (all fields optional)
export const profileUpdateSchema = profileCreateSchema.partial();

// Validation middleware factory
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Query parameter validation
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// URL parameter validation
export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid URL parameters',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Profile ID validation
export const profileIdSchema = z.object({
  id: z.string().uuid("Invalid profile ID"),
});

// Query filters validation
export const profileFiltersSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  country: z.string().length(2).optional(),
  category_id: z.string().uuid().optional(),
  niche_id: z.string().uuid().optional(),
  profile_type: z.enum(['creator', 'organization']).optional(),
  minFollowers: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxFollowers: z.string().regex(/^\d+$/).transform(Number).optional(),
  collaborationType: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  // Keep old filter names for backward compatibility
  industry: z.string().optional(),
  niche: z.string().optional(),
});
