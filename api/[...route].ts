import 'dotenv/config';
import express from 'express';
import { profileService, ProfileFilters } from '../server/services/database';
import { storageService } from '../server/services/storage';
import { emailService } from '../server/services/email';
import multer from 'multer';

const app = express();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed'));
        }
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ============= PROFILE ROUTES =============

// GET /api/profiles/me
app.get('/api/profiles/me', async (req, res) => {
    try {
        const userId = req.query.user_id as string;
        if (!userId) {
            return res.status(400).json({ error: 'user_id query parameter required' });
        }
        const profile = await profileService.getByUserId(userId);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found', exists: false });
        }
        res.json({ ...profile, exists: true });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// GET /api/profiles
app.get('/api/profiles', async (req, res) => {
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
        console.error('Error fetching profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// GET /api/profiles/:id
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const profile = await profileService.getById(req.params.id);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/profiles
app.post('/api/profiles', async (req, res) => {
    try {
        console.log('[POST] /api/profiles - Payload:', JSON.stringify(req.body));
        const profile = await profileService.create(req.body);
        res.status(201).json(profile);
    } catch (error) {
        console.error('Error creating profile:', error);
        // @ts-ignore
        if (error && error.message) console.error('Error message:', error.message);
        // @ts-ignore
        if (error && error.details) console.error('Error details:', error.details);
        // @ts-ignore
        if (error && error.hint) console.error('Error hint:', error.hint);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});

// PUT /api/profiles/:id
app.put('/api/profiles/:id', async (req, res) => {
    try {
        const profile = await profileService.update(req.params.id, req.body);
        res.json(profile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// DELETE /api/profiles/:id
app.delete('/api/profiles/:id', async (req, res) => {
    try {
        await profileService.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// ============= ADMIN ROUTES =============

app.get('/api/admin/pending', async (req, res) => {
    try {
        const profiles = await profileService.getPending();
        res.json(profiles);
    } catch (error) {
        console.error('Error fetching pending profiles:', error);
        res.status(500).json({ error: 'Failed to fetch pending profiles' });
    }
});

app.post('/api/admin/approve/:id', async (req, res) => {
    try {
        const profile = await profileService.approve(req.params.id);
        emailService.sendProfileApprovedEmail(profile.user_id, profile.name)
            .catch(err => console.error('[Email] Failed to send approval email:', err));
        res.json(profile);
    } catch (error) {
        console.error('Error approving profile:', error);
        res.status(500).json({ error: 'Failed to approve profile' });
    }
});

app.post('/api/admin/reject/:id', async (req, res) => {
    try {
        const profile = await profileService.reject(req.params.id);
        emailService.sendProfileRejectedEmail(profile.user_id, profile.name)
            .catch(err => console.error('[Email] Failed to send rejection email:', err));
        res.json(profile);
    } catch (error) {
        console.error('Error rejecting profile:', error);
        res.status(500).json({ error: 'Failed to reject profile' });
    }
});

app.delete('/api/admin/delete/:id', async (req, res) => {
    try {
        await profileService.delete(req.params.id);
        res.json({ success: true, message: 'Profile deleted' });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// ============= UPLOAD ROUTES =============

app.post('/api/upload/photo', upload.single('photo'), async (req, res) => {
    try {
        const userId = req.body.user_id;
        const file = req.file;
        if (!userId) return res.status(400).json({ error: 'user_id is required' });
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const result = await storageService.uploadProfilePhoto(
            userId,
            file.buffer,
            file.originalname,
            file.mimetype
        );
        res.json({ success: true, url: result.url, path: result.path });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

app.post('/api/upload/video', upload.single('video'), async (req, res) => {
    try {
        const userId = req.body.user_id;
        const file = req.file;
        if (!userId) return res.status(400).json({ error: 'user_id is required' });
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const result = await storageService.uploadVideoIntro(
            userId,
            file.buffer,
            file.originalname,
            file.mimetype
        );
        res.json({ success: true, url: result.url, path: result.path });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Export for Vercel serverless
export default app;
