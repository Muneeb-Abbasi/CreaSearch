// Script to clean up old rejected profiles for user
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupProfiles() {
    const userId = process.argv[2];

    if (!userId) {
        console.error('❌ Usage: npx tsx cleanup-profiles.ts <user_id>');
        process.exit(1);
    }

    console.log('Deleting rejected profiles for user:', userId);

    const { data, error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'rejected')
        .select();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`✅ Deleted ${data?.length || 0} rejected profiles`);

    // Show remaining profiles
    const { data: remaining } = await supabase
        .from('profiles')
        .select('id, name, status')
        .eq('user_id', userId);

    console.log('\nRemaining profiles:');
    remaining?.forEach(p => {
        console.log(`  - ${p.name} (${p.status})`);
    });
}

cleanupProfiles();
