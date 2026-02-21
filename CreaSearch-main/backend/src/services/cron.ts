/**
 * Verification Cron Service
 * ==========================
 * Handles scheduled background tasks for social media verification updates.
 * 
 * Schedule:
 * - YouTube: Weekly refresh (every Sunday at 3 AM)
 * - Instagram Queue: Process queued verifications (every 4 hours)
 * - Verification Retry: Process failed tasks ready for retry (every hour)
 */

import cron from 'node-cron';
import { socialAccountService, SocialAccount } from './database';
import { logger } from '../utils/logger';

// Track if cron is already initialized
let cronInitialized = false;

/**
 * Refresh YouTube subscriber count for a single social account
 */
async function refreshYouTubeForAccount(account: SocialAccount): Promise<boolean> {
    try {
        const { verifyYouTubeChannel } = await import('./youtube');
        const url = account.platform_url;

        if (!url) return false;

        const result = await verifyYouTubeChannel(url);

        if (result.status === 'VERIFIED') {
            await socialAccountService.updateVerification(account.profile_id, 'youtube', {
                platform_user_id: result.channelId,
                display_name: result.channelTitle,
                follower_count: result.subscribers || 0,
                verification_status: 'verified',
                verified_at: new Date().toISOString(),
                raw_data: {
                    channelId: result.channelId,
                    channelTitle: result.channelTitle,
                    subscribers: result.subscribers,
                    status: result.status,
                    lastUpdated: new Date().toISOString()
                }
            });
            logger.info(`[Cron] Updated YouTube for profile ${account.profile_id}: ${result.subscribers} subscribers`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error(`[Cron] Failed to refresh YouTube for profile ${account.profile_id}:`, error);

        // Enqueue failed YouTube refresh for retry
        try {
            const { verificationQueueService } = await import('./verification-queue');
            await verificationQueueService.enqueue(account.profile_id, 'youtube', account.platform_url, 'retry');
            logger.info(`[Cron] Enqueued YouTube retry for profile ${account.profile_id}`);
        } catch (enqueueError) {
            logger.error(`[Cron] Failed to enqueue YouTube retry:`, enqueueError);
        }

        return false;
    }
}

/**
 * Refresh YouTube counts for all profiles with YouTube accounts
 */
async function refreshAllYouTubeProfiles(): Promise<{ updated: number; failed: number; total: number }> {
    logger.info('[Cron] Starting weekly YouTube refresh...');

    const stats = { updated: 0, failed: 0, total: 0 };

    try {
        const { getSupabaseClient } = await import('./database');
        const supabase = getSupabaseClient();

        // Get all YouTube social accounts that are verified
        const { data: youtubeAccounts, error } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('platform', 'youtube')
            .eq('verification_status', 'verified');

        if (error) throw error;

        for (const account of youtubeAccounts || []) {
            stats.total++;

            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

            const success = await refreshYouTubeForAccount(account);
            if (success) {
                stats.updated++;
            } else {
                stats.failed++;
            }
        }

        logger.info(`[Cron] YouTube refresh complete: ${stats.updated}/${stats.total} updated, ${stats.failed} failed (${stats.failed} enqueued for retry)`);
    } catch (error) {
        logger.error('[Cron] YouTube refresh job failed:', error);
    }

    return stats;
}

/**
 * Process queued Instagram verifications
 */
async function processInstagramQueue(): Promise<void> {
    logger.info('[Cron] Processing Instagram verification queue...');
    try {
        const { verificationQueueService } = await import('./verification-queue');
        const stats = await verificationQueueService.processQueue('instagram', 2); // Process max 2 to stay within quota
        logger.info(`[Cron] Instagram queue: ${stats.processed} processed, ${stats.succeeded} succeeded, ${stats.failed} failed`);
    } catch (error) {
        logger.error('[Cron] Instagram queue processing failed:', error);
    }
}

/**
 * Process all verification retries that are ready
 */
async function processRetryQueue(): Promise<void> {
    try {
        const { verificationQueueService } = await import('./verification-queue');
        const stats = await verificationQueueService.processQueue(undefined, 5); // Process up to 5 retries
        if (stats.processed > 0) {
            logger.info(`[Cron] Retry queue: ${stats.processed} processed, ${stats.succeeded} succeeded, ${stats.failed} failed`);
        }
    } catch (error) {
        logger.error('[Cron] Retry queue processing failed:', error);
    }
}

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
    if (cronInitialized) {
        logger.info('[Cron] Already initialized, skipping...');
        return;
    }

    // Weekly YouTube refresh - Every Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        logger.info('[Cron] Running scheduled YouTube refresh...');
        await refreshAllYouTubeProfiles();
    }, {
        timezone: 'Asia/Karachi'
    });

    // Instagram queue processing - Every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        await processInstagramQueue();
    }, {
        timezone: 'Asia/Karachi'
    });

    // Verification retry processor - Every hour
    cron.schedule('30 * * * *', async () => {
        await processRetryQueue();
    }, {
        timezone: 'Asia/Karachi'
    });

    logger.info('[Cron] Scheduled jobs initialized:');
    logger.info('  - YouTube refresh: Weekly (Sunday 3:00 AM PKT)');
    logger.info('  - Instagram queue: Every 4 hours');
    logger.info('  - Verification retries: Every hour (at :30)');

    cronInitialized = true;
}

/**
 * Manual trigger for YouTube refresh (admin use)
 */
export async function triggerYouTubeRefresh(): Promise<{ updated: number; failed: number; total: number }> {
    return refreshAllYouTubeProfiles();
}

/**
 * Get cron status
 */
export function getCronStatus(): { initialized: boolean; nextYouTubeRun: string } {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(3, 0, 0, 0);

    return {
        initialized: cronInitialized,
        nextYouTubeRun: nextSunday.toISOString()
    };
}
