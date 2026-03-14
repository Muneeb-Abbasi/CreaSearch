// Script to grant admin rights to a user by email
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('❌ Missing environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin() {
    const email = process.argv[2];

    if (!email) {
        logger.error('❌ Usage: npx tsx set-admin.ts <email>');
        process.exit(1);
    }

    logger.info(`Looking up user with email: ${email}`);

    // 1. Get user ID from Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        logger.error('❌ Error fetching users:', authError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        logger.error(`❌ User not found with email: ${email}`);
        return;
    }

    logger.info(`✅ Found user: ${user.id}`);

    // 2. Update Role in Profiles table
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        logger.error('❌ Error updating profile:', error);
        return;
    }

    logger.info(`✅ Successfully granted ADMIN rights to: ${email}`);
    logger.info(`   Profile ID: ${data.id}`);
    logger.info(`   New Role: ${data.role}`);
}

setAdmin();
