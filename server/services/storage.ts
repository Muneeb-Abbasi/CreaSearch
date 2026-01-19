import { getSupabaseClient } from './database';

export interface UploadResult {
    url: string;
    path: string;
}

export const storageService = {
    /**
     * Upload a profile photo to Supabase Storage
     */
    async uploadProfilePhoto(userId: string, file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
        const supabase = getSupabaseClient();

        // Generate unique filename with user folder
        const ext = filename.split('.').pop() || 'jpg';
        const uniqueFilename = `${userId}/${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('profile-photos')
            .upload(uniqueFilename, file, {
                contentType: mimeType,
                upsert: true // Replace if exists
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(data.path);

        return {
            url: urlData.publicUrl,
            path: data.path
        };
    },

    /**
     * Upload a video intro to Supabase Storage
     */
    async uploadVideoIntro(userId: string, file: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
        const supabase = getSupabaseClient();

        // Generate unique filename with user folder
        const ext = filename.split('.').pop() || 'mp4';
        const uniqueFilename = `${userId}/${Date.now()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('intro-videos')
            .upload(uniqueFilename, file, {
                contentType: mimeType,
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('intro-videos')
            .getPublicUrl(data.path);

        return {
            url: urlData.publicUrl,
            path: data.path
        };
    },

    /**
     * Delete a file from storage
     */
    async deleteFile(bucket: 'profile-photos' | 'intro-videos', path: string): Promise<void> {
        const supabase = getSupabaseClient();

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    }
};
