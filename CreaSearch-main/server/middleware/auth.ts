
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for auth verification
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for auth middleware');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("Auth error:", error);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // First run authentication
    await requireAuth(req, res, async () => {
        // Then check if the user has admin metadata or role
        // This is a placeholder. You should implement actual role checking logic
        // based on your app's structure (e.g., profiles table or app_metadata)

        // For now, let's assume we check a "role" in app_metadata or a profile lookup
        // const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', req.user.id).single();

        // if (profile?.role !== 'admin') {
        //    return res.status(403).json({ error: 'Admin access required' });
        // }

        // TEMPORARY: Allow all authenticated users for now until Admin role logic is finalized
        next();
    });
};
