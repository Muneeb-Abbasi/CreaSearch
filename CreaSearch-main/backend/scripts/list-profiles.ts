// Script to list all profiles and check their status
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

async function listProfiles() {
    logger.info('Fetching all profiles...\n');

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, status, role')
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error:', error);
        return;
    }

    logger.info('=== ALL PROFILES ===\n');
    profiles?.forEach((p, i) => {
        logger.info(`${i + 1}. ${p.name}`);
        logger.info(`   ID: ${p.id}`);
        logger.info(`   User ID: ${p.user_id || 'NULL (mock profile)'}`);
        logger.info(`   Status: ${p.status}`);
        logger.info(`   Role: ${p.role}`);
        logger.info('');
    });

    // Also list auth users
    logger.info('=== AUTH USERS ===\n');
    const { data: authData } = await supabase.auth.admin.listUsers();
    authData?.users?.forEach((u, i) => {
        logger.info(`${i + 1}. ${u.email}`);
        logger.info(`   Auth User ID: ${u.id}`);
        logger.info('');
    });
}

listProfiles();
