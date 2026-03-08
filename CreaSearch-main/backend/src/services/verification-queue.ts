import { getSupabaseClient } from './database';
import { verifyYouTubeChannel } from './youtube';
import { verifyInstagramProfile } from './instagram';
import { verifyFacebookProfile } from './facebook';
import { socialAccountService, scoringService } from './database';
import { logger } from '../utils/logger';

// Retry delay schedule (in milliseconds)
const RETRY_DELAYS = [
    1 * 60 * 60 * 1000,   // 1st retry: 1 hour
    6 * 60 * 60 * 1000,   // 2nd retry: 6 hours
    24 * 60 * 60 * 1000,  // 3rd retry: 24 hours
];

export interface VerificationQueueItem {
    id: string;
    profile_id: string;
    platform: 'youtube' | 'instagram' | 'facebook';
    platform_url: string;
    task_type: 'initial' | 'refresh' | 'retry';
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'exhausted';
    retry_count: number;
    max_retries: number;
    last_error: string | null;
    next_attempt_at: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export const verificationQueueService = {
    /**
     * Add a verification task to the queue
     */
    async enqueue(
        profileId: string,
        platform: 'youtube' | 'instagram' | 'facebook',
        platformUrl: string,
        taskType: 'initial' | 'refresh' | 'retry' = 'initial'
    ): Promise<VerificationQueueItem> {
        const supabase = getSupabaseClient();

        // Check for existing active task
        const { data: existing } = await supabase
            .from('verification_queue')
            .select('*')
            .eq('profile_id', profileId)
            .eq('platform', platform)
            .in('status', ['queued', 'processing'])
            .maybeSingle();

        if (existing) {
            logger.info(`[VerifyQueue] Active task already exists for ${platform}/${profileId}`);
            return existing;
        }

        const { data, error } = await supabase
            .from('verification_queue')
            .insert({
                profile_id: profileId,
                platform,
                platform_url: platformUrl,
                task_type: taskType,
                status: 'queued',
                retry_count: 0,
                next_attempt_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            logger.error('[VerifyQueue] Error enqueueing:', error);
            throw error;
        }

        logger.info(`[VerifyQueue] Enqueued ${taskType} task for ${platform}/${profileId}`);
        return data;
    },

    /**
     * Pick up the next task ready for processing
     */
    async dequeue(platform?: string): Promise<VerificationQueueItem | null> {
        const supabase = getSupabaseClient();

        let query = supabase
            .from('verification_queue')
            .select('*')
            .in('status', ['queued', 'failed'])
            .lte('next_attempt_at', new Date().toISOString())
            .order('next_attempt_at', { ascending: true })
            .limit(1);

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data: items, error } = await query;

        if (error || !items || items.length === 0) return null;

        const item = items[0];

        // Only process failed items if they haven't exhausted retries
        if (item.status === 'failed' && item.retry_count >= item.max_retries) {
            // Mark as exhausted
            await supabase
                .from('verification_queue')
                .update({ status: 'exhausted', updated_at: new Date().toISOString() })
                .eq('id', item.id);
            return null;
        }

        // Mark as processing
        const { data: updated, error: updateError } = await supabase
            .from('verification_queue')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', item.id)
            .eq('status', item.status) // Optimistic lock
            .select()
            .single();

        if (updateError || !updated) return null;

        return updated;
    },

    /**
     * Process a single verification task
     */
    async processTask(task: VerificationQueueItem): Promise<boolean> {
        const supabase = getSupabaseClient();

        try {
            logger.info(`[VerifyQueue] Processing ${task.platform} task for profile ${task.profile_id} (attempt ${task.retry_count + 1})`);

            let success = false;

            if (task.platform === 'youtube') {
                const result = await verifyYouTubeChannel(task.platform_url);

                if (result.success && result.status === 'VERIFIED') {
                    await socialAccountService.updateVerification(task.profile_id, 'youtube', {
                        verification_status: 'verified',
                        follower_count: result.subscribers || 0,
                        platform_username: result.channelTitle || null,
                        platform_user_id: result.channelId || null,
                        verified_at: new Date().toISOString(),
                    });
                    success = true;
                } else if (result.status === 'HIDDEN') {
                    await socialAccountService.updateVerification(task.profile_id, 'youtube', {
                        verification_status: 'verified',
                        follower_count: 0,
                        platform_username: result.channelTitle || null,
                        platform_user_id: result.channelId || null,
                        verified_at: new Date().toISOString(),
                        raw_data: { hidden_subscribers: true } as any,
                    });
                    success = true;
                } else {
                    throw new Error(result.error || `YouTube verification failed: ${result.status}`);
                }
            } else if (task.platform === 'instagram') {
                const result = await verifyInstagramProfile(task.platform_url);

                if (result.success && result.status === 'VALIDATED') {
                    await socialAccountService.updateVerification(task.profile_id, 'instagram', {
                        verification_status: 'verified',
                        follower_count: result.followers || 0,
                        platform_username: result.username || null,
                        verified_at: new Date().toISOString(),
                    });
                    success = true;
                } else if (result.status === 'PRIVATE') {
                    await socialAccountService.updateVerification(task.profile_id, 'instagram', {
                        verification_status: 'verified',
                        follower_count: 0,
                        platform_username: result.username || null,
                        verified_at: new Date().toISOString(),
                        raw_data: { is_private: true } as any,
                    });
                    success = true;
                } else {
                    throw new Error(result.error || `Instagram verification failed: ${result.status}`);
                }
            } else if (task.platform === 'facebook') {
                const result = await verifyFacebookProfile(task.platform_url);

                if (result.status === 'VALIDATED') {
                    await socialAccountService.updateVerification(task.profile_id, 'facebook', {
                        verification_status: 'verified',
                        follower_count: result.followers || 0,
                        platform_username: result.pageName || null,
                        verified_at: new Date().toISOString(),
                    });
                    success = true;
                } else {
                    throw new Error(result.error || `Facebook verification failed: ${result.status}`);
                }
            }

            if (success) {
                await this.markCompleted(task.id);
                // Update the profile's total follower count and score
                await this.recalculateProfileFollowers(task.profile_id);
                await scoringService.updateProfileScore(task.profile_id);
                logger.info(`[VerifyQueue] ✅ ${task.platform} verification completed for profile ${task.profile_id}`);
                return true;
            }

            return false;
        } catch (error: any) {
            logger.error(`[VerifyQueue] ❌ ${task.platform} verification failed for profile ${task.profile_id}:`, error.message);
            await this.markFailed(task.id, error.message);
            return false;
        }
    },

    /**
     * Mark a task as completed
     */
    async markCompleted(taskId: string): Promise<void> {
        const supabase = getSupabaseClient();
        await supabase
            .from('verification_queue')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', taskId);
    },

    /**
     * Mark a task as failed and schedule retry with exponential backoff
     */
    async markFailed(taskId: string, errorMessage: string): Promise<void> {
        const supabase = getSupabaseClient();

        // Get current task to check retry count
        const { data: task } = await supabase
            .from('verification_queue')
            .select('*')
            .eq('id', taskId)
            .single();

        if (!task) return;

        const newRetryCount = task.retry_count + 1;
        const isExhausted = newRetryCount >= task.max_retries;

        // Calculate next attempt time with backoff
        const delayMs = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)];
        const nextAttempt = new Date(Date.now() + delayMs);

        await supabase
            .from('verification_queue')
            .update({
                status: isExhausted ? 'exhausted' : 'failed',
                retry_count: newRetryCount,
                last_error: errorMessage,
                next_attempt_at: isExhausted ? task.next_attempt_at : nextAttempt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', taskId);

        if (isExhausted) {
            logger.warn(`[VerifyQueue] Task ${taskId} exhausted all ${task.max_retries} retries`);
        } else {
            logger.info(`[VerifyQueue] Task ${taskId} scheduled for retry ${newRetryCount}/${task.max_retries} at ${nextAttempt.toISOString()}`);
        }
    },

    /**
     * Process all ready tasks for a given platform (with limit to avoid overloading)
     */
    async processQueue(platform?: string, limit = 3): Promise<{ processed: number; succeeded: number; failed: number }> {
        const stats = { processed: 0, succeeded: 0, failed: 0 };

        for (let i = 0; i < limit; i++) {
            const task = await this.dequeue(platform);
            if (!task) break;

            stats.processed++;
            const success = await this.processTask(task);
            if (success) {
                stats.succeeded++;
            } else {
                stats.failed++;
            }

            // Add delay between processing to avoid rate limits
            if (i < limit - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (stats.processed > 0) {
            logger.info(`[VerifyQueue] Processed ${stats.processed} tasks: ${stats.succeeded} succeeded, ${stats.failed} failed`);
        }

        return stats;
    },

    /**
     * Get queue stats for admin dashboard
     */
    async getQueueStats(): Promise<{ queued: number; processing: number; failed: number; exhausted: number; completed: number }> {
        const supabase = getSupabaseClient();

        const statuses = ['queued', 'processing', 'failed', 'exhausted', 'completed'];
        const result: any = {};

        for (const status of statuses) {
            const { count } = await supabase
                .from('verification_queue')
                .select('*', { count: 'exact', head: true })
                .eq('status', status);
            result[status] = count || 0;
        }

        return result;
    },

    /**
     * Get recent queue items for admin dashboard
     */
    async getRecentItems(limit = 20): Promise<VerificationQueueItem[]> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('verification_queue')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /**
     * Admin: manually retry a failed/exhausted task
     */
    async adminRetry(taskId: string): Promise<VerificationQueueItem> {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('verification_queue')
            .update({
                status: 'queued',
                retry_count: 0,
                last_error: null,
                next_attempt_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;
        logger.info(`[VerifyQueue] Admin reset task ${taskId} for retry`);
        return data;
    },

    /**
     * Recalculate profile's total follower count from all verified social accounts
     */
    async recalculateProfileFollowers(profileId: string): Promise<void> {
        const supabase = getSupabaseClient();
        const accounts = await socialAccountService.getByProfileId(profileId);

        const totalFollowers = accounts
            .filter(a => a.verification_status === 'verified')
            .reduce((sum, a) => sum + (a.follower_count || 0), 0);

        await supabase
            .from('profiles')
            .update({ follower_total: totalFollowers, updated_at: new Date().toISOString() })
            .eq('id', profileId);
    },
};
