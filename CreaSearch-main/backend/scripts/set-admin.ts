// Script to grant admin rights to a user by email
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Usage: npx tsx set-admin.ts <email>');
        process.exit(1);
    }

    console.log(`Looking up user with email: ${email}`);

    // 1. Get user ID from Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('❌ Error fetching users:', authError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`❌ User not found with email: ${email}`);
        return;
    }

    console.log(`✅ Found user: ${user.id}`);

    // 2. Update Role in Profiles table
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('❌ Error updating profile:', error);
        return;
    }

    console.log(`✅ Successfully granted ADMIN rights to: ${email}`);
    console.log(`   Profile ID: ${data.id}`);
    console.log(`   New Role: ${data.role}`);
}

setAdmin();
