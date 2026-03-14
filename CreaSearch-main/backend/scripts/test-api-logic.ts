import 'dotenv/config';
import express from 'express';
import { getSupabaseClient } from '../src/services/database';

async function main() {
    const supabase = getSupabaseClient();
    const { data: profile } = await supabase.from('profiles').select('id, user_id').limit(1).single();

    if (!profile) return console.error('No profile');

    // Simulate the exact API logic without running the full server
    const { queueInstagramVerification, extractInstagramUsername } = await import('../src/services/instagram');
    const { socialAccountService } = await import('../src/services/database');
    
    const profileUrl = 'https://instagram.com/dummyTest';
    const profileId = profile.id;

    try {
        const username = extractInstagramUsername(profileUrl);
        console.log('Extracted username:', username);

        console.log('Upserting social account...');
        await socialAccountService.upsert(profileId, {
            platform: 'instagram',
            platform_url: profileUrl,
            platform_username: username,
            verification_status: 'pending',
            raw_data: { queuedAt: new Date().toISOString() }
        });
        console.log('Upsert done.');

        console.log('Queueing...');
        const queueResult = await queueInstagramVerification(profileId, profileUrl);
        console.log('Queue result:', queueResult);

        // Check DB
        const { data: accs } = await supabase.from('social_accounts').select('*').eq('profile_id', profileId).eq('platform', 'instagram');
        console.log('Accounts in DB after API logic:', accs);

    } catch (err) {
        console.error('Simulated API logic failed:', err);
    }
}

main().catch(console.error);
