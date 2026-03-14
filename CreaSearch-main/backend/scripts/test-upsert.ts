import 'dotenv/config';
import { getSupabaseClient, socialAccountService } from '../src/services/database';

async function main() {
    const supabase = getSupabaseClient();
    
    // Get latest profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!profile) {
        console.error('No profiles found');
        return;
    }
    
    console.log(`Testing upsert on profile ${profile.id}...`);
    
    try {
        const result = await socialAccountService.upsert(profile.id, {
            platform: 'instagram',
            platform_url: 'https://instagram.com/test',
            platform_username: 'test',
            verification_status: 'pending',
            raw_data: { queuedAt: new Date().toISOString() }
        });
        console.log('Upsert succeeded:', result);
    } catch (err) {
        console.error('Upsert failed:', err);
    }
}

main().catch(console.error);
