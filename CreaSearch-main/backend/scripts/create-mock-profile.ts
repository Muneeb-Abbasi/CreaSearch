// Script to create a mock profile for testing reviews
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('❌ Missing environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMockProfile() {
    // Create a mock profile - user_id is null since this is a test profile
    const mockProfile = {
        // user_id will be null - no real auth user linked
        role: 'creator',
        name: 'Sarah Khan',
        title: 'Content Creator & Digital Influencer',
        location: 'Karachi, Pakistan',
        bio: 'Passionate content creator specializing in lifestyle, fashion, and beauty. With 5+ years of experience in digital marketing and brand collaborations, I help brands connect with their audience through authentic storytelling.',
        avatar_url: null,
        video_intro_url: null,
        collaboration_types: ['Sponsored Content', 'Brand Ambassador', 'Product Reviews'],
        social_links: {
            instagram: 'https://instagram.com/sarahkhan_pk',
            youtube: 'https://youtube.com/@sarahkhan',
            twitter: 'https://twitter.com/sarahkhan'
        },
        follower_total: 125000,
        verified_socials: [],
        profile_completion: 85,
        gigs_completed: 12,
        rating_score: 0,
        creasearch_score: 78,
        status: 'approved' // Already approved so it shows in the discovery page
    };

    logger.info('Creating mock profile...');

    const { data, error } = await supabase
        .from('profiles')
        .insert(mockProfile)
        .select()
        .single();

    if (error) {
        logger.error('Error creating profile:', error);
        return;
    }

    logger.info('✅ Mock profile created successfully!');
    logger.info('Profile ID:', data.id);
    logger.info('Name:', data.name);
    logger.info('Status:', data.status);
    logger.info('\nYou can now visit: http://localhost:5174/creator/' + data.id);
}

createMockProfile();
