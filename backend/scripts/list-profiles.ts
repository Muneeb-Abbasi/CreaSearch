// Script to list all profiles and check their status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otepzkrnnizckzqscbhd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZXB6a3Jubml6Y2t6cXNjYmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY3NzYwNSwiZXhwIjoyMDg0MjUzNjA1fQ.rTqpxD7MbQeJgywVOGXv1AYDlHTgLT5puYUKWaNXiOI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listProfiles() {
    console.log('Fetching all profiles...\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, status, role')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('=== ALL PROFILES ===\n');
    profiles?.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   User ID: ${p.user_id || 'NULL (mock profile)'}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Role: ${p.role}`);
        console.log('');
    });

    // Also list auth users
    console.log('=== AUTH USERS ===\n');
    const { data: authData } = await supabase.auth.admin.listUsers();
    authData?.users?.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email}`);
        console.log(`   Auth User ID: ${u.id}`);
        console.log('');
    });
}

listProfiles();
