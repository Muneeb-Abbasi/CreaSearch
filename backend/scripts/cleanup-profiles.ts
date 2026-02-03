// Script to clean up old rejected profiles for user
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otepzkrnnizckzqscbhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZXB6a3Jubml6Y2t6cXNjYmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY3NzYwNSwiZXhwIjoyMDg0MjUzNjA1fQ.rTqpxD7MbQeJgywVOGXv1AYDlHTgLT5puYUKWaNXiOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupProfiles() {
    const userId = '29042653-9cb1-44be-aee6-6ee9be25eb04'; // Muneeb's user ID

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
