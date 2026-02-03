// Script to create a mock profile for testing reviews
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otepzkrnnizckzqscbhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZXB6a3Jubml6Y2t6cXNjYmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY3NzYwNSwiZXhwIjoyMDg0MjUzNjA1fQ.rTqpxD7MbQeJgywVOGXv1AYDlHTgLT5puYUKWaNXiOI';

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

    console.log('Creating mock profile...');

    const { data, error } = await supabase
        .from('profiles')
        .insert(mockProfile)
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        return;
    }

    console.log('✅ Mock profile created successfully!');
    console.log('Profile ID:', data.id);
    console.log('Name:', data.name);
    console.log('Status:', data.status);
    console.log('\nYou can now visit: http://localhost:5174/creator/' + data.id);
}

createMockProfile();
