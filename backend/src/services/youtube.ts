/**
 * YouTube Verification Service
 * ============================
 * Verifies YouTube channel subscriber counts using the YouTube Data API v3.
 * 
 * Usage:
 *   import { verifyYouTubeChannel } from './youtube';
 *   const result = await verifyYouTubeChannel('https://youtube.com/@username');
 */

import { google } from 'googleapis';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY
});

export type YouTubeStatus = 'VERIFIED' | 'HIDDEN' | 'NOT_FOUND' | 'FAILED';

export interface YouTubeVerificationResult {
    channelId: string | null;
    channelTitle: string | null;
    subscribers: number | null;
    status: YouTubeStatus;
    error?: string;
}

/**
 * Extract channel identifier from YouTube URL
 * Supports: /channel/ID, /@handle, /c/username, /user/username
 */
export function extractChannelIdentifier(channelUrl: string): { type: 'id' | 'handle' | 'username'; value: string } | null {
    try {
        const url = new URL(channelUrl);
        const path = url.pathname.replace(/^\/+|\/+$/g, ''); // Trim slashes

        if (path.startsWith('channel/')) {
            return { type: 'id', value: path.split('/')[1] };
        }

        if (path.startsWith('@')) {
            return { type: 'handle', value: path.substring(1) };
        }

        if (path.startsWith('c/') || path.startsWith('user/')) {
            return { type: 'username', value: path.split('/')[1] };
        }

        // Bare username (legacy format)
        if (path && !path.includes('/')) {
            return { type: 'username', value: path };
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get channel ID from various URL formats
 */
async function getChannelId(channelUrl: string): Promise<string | null> {
    const identifier = extractChannelIdentifier(channelUrl);
    if (!identifier) return null;

    if (identifier.type === 'id') {
        return identifier.value;
    }

    // For @handle or username, search for the channel
    try {
        const response = await youtube.search.list({
            q: identifier.value,
            part: ['snippet'],
            type: ['channel'],
            maxResults: 1
        });

        const items = response.data.items || [];
        if (items.length === 0) return null;

        return items[0].snippet?.channelId || null;
    } catch (error) {
        console.error('[YouTube] Error searching for channel:', error);
        return null;
    }
}

/**
 * Verify a YouTube channel and get subscriber count
 * 
 * @param channelUrl - The YouTube channel URL
 * @returns YouTubeVerificationResult with subscriber count and status
 */
export async function verifyYouTubeChannel(channelUrl: string): Promise<YouTubeVerificationResult> {
    if (!YOUTUBE_API_KEY) {
        console.error('[YouTube] API key not configured');
        return {
            channelId: null,
            channelTitle: null,
            subscribers: null,
            status: 'FAILED',
            error: 'YouTube API key not configured'
        };
    }

    try {
        const channelId = await getChannelId(channelUrl);

        if (!channelId) {
            return {
                channelId: null,
                channelTitle: null,
                subscribers: null,
                status: 'NOT_FOUND',
                error: 'Channel not found'
            };
        }

        // Get channel statistics
        const response = await youtube.channels.list({
            id: [channelId],
            part: ['statistics', 'snippet']
        });

        const items = response.data.items || [];
        if (items.length === 0) {
            return {
                channelId,
                channelTitle: null,
                subscribers: null,
                status: 'NOT_FOUND',
                error: 'Channel not found'
            };
        }

        const channel = items[0];
        const stats = channel.statistics;
        const snippet = channel.snippet;

        // Check if subscriber count is hidden
        if (stats?.hiddenSubscriberCount) {
            return {
                channelId,
                channelTitle: snippet?.title || null,
                subscribers: null,
                status: 'HIDDEN',
                error: 'Subscriber count is hidden'
            };
        }

        const subscriberCount = stats?.subscriberCount
            ? parseInt(stats.subscriberCount, 10)
            : null;

        return {
            channelId,
            channelTitle: snippet?.title || null,
            subscribers: subscriberCount,
            status: 'VERIFIED'
        };
    } catch (error: any) {
        console.error('[YouTube] Verification error:', error.message);
        return {
            channelId: null,
            channelTitle: null,
            subscribers: null,
            status: 'FAILED',
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Batch verify multiple YouTube channels
 */
export async function verifyMultipleChannels(channelUrls: string[]): Promise<YouTubeVerificationResult[]> {
    const results: YouTubeVerificationResult[] = [];

    for (const url of channelUrls) {
        const result = await verifyYouTubeChannel(url);
        results.push(result);
    }

    return results;
}
