import { Resend } from 'resend';
import { getSupabaseClient } from './database';

const resendApiKey = process.env.RESEND_API_KEY || '';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
    if (!resendClient) {
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured');
        }
        resendClient = new Resend(resendApiKey);
    }
    return resendClient;
}

// Fetch user email from Supabase auth.users table
async function getUserEmail(userId: string): Promise<string | null> {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .auth.admin.getUserById(userId);

        if (error) {
            console.error('[Email] Error fetching user email:', error);
            return null;
        }

        return data?.user?.email || null;
    } catch (error) {
        console.error('[Email] Failed to get user email:', error);
        return null;
    }
}

// Email templates
const FROM_EMAIL = 'Creasearch <dev@pakistanrecruitment.com>'; // Use verified domain in production

export const emailService = {
    async sendProfileApprovedEmail(userId: string, name: string): Promise<boolean> {
        try {
            const email = await getUserEmail(userId);
            if (!email) {
                console.log('[Email] No email found for user:', userId);
                return false;
            }

            const resend = getResendClient();
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: '🎉 Your Creasearch Profile is Approved!',
                html: `
                    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #10B981; margin: 0;">Creasearch</h1>
                        </div>
                        
                        <h2 style="color: #1F2937; margin-bottom: 20px;">Congratulations, ${name}! 🎉</h2>
                        
                        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                            Your creator profile has been approved and is now live on Creasearch! 
                            Brands and businesses can now discover you and reach out for collaborations.
                        </p>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="https://creasearch.com/search" 
                               style="background-color: #10B981; color: white; padding: 14px 28px; 
                                      text-decoration: none; border-radius: 8px; font-weight: 600;
                                      display: inline-block;">
                                View Your Profile
                            </a>
                        </div>
                        
                        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                            <strong>What's next?</strong><br>
                            • Complete your portfolio with your best work<br>
                            • Add a video introduction to stand out<br>
                            • Share your profile with brands you'd like to work with
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                        
                        <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
                            © 2026 Creasearch. Pakistan's Creator Discovery Platform.
                        </p>
                    </div>
                `
            });

            if (error) {
                console.error('[Email] Failed to send approval email:', error);
                return false;
            }

            console.log('[Email] Approval email sent successfully:', data?.id);
            return true;
        } catch (error) {
            console.error('[Email] Error sending approval email:', error);
            return false;
        }
    },

    async sendProfileRejectedEmail(userId: string, name: string): Promise<boolean> {
        try {
            const email = await getUserEmail(userId);
            if (!email) {
                console.log('[Email] No email found for user:', userId);
                return false;
            }

            const resend = getResendClient();
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Update on Your Creasearch Profile Application',
                html: `
                    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #10B981; margin: 0;">Creasearch</h1>
                        </div>
                        
                        <h2 style="color: #1F2937; margin-bottom: 20px;">Hi ${name},</h2>
                        
                        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                            Thank you for your interest in joining Creasearch. After reviewing your profile, 
                            we weren't able to approve it at this time.
                        </p>
                        
                        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                            <strong>Common reasons for this include:</strong><br>
                            • Incomplete profile information<br>
                            • Profile photo or bio doesn't meet our guidelines<br>
                            • Social media links couldn't be verified
                        </p>
                        
                        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                            We encourage you to update your profile and resubmit. Make sure to:
                        </p>
                        
                        <ul style="color: #4B5563; font-size: 16px; line-height: 1.8;">
                            <li>Add a clear, professional profile photo</li>
                            <li>Write a compelling bio about your work</li>
                            <li>Include accurate social media links</li>
                            <li>Specify your collaboration preferences</li>
                        </ul>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="https://creasearch.com/create-profile" 
                               style="background-color: #10B981; color: white; padding: 14px 28px; 
                                      text-decoration: none; border-radius: 8px; font-weight: 600;
                                      display: inline-block;">
                                Update Your Profile
                            </a>
                        </div>
                        
                        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                            If you have questions, feel free to reach out to us.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                        
                        <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
                            © 2026 Creasearch. Pakistan's Creator Discovery Platform.
                        </p>
                    </div>
                `
            });

            if (error) {
                console.error('[Email] Failed to send rejection email:', error);
                return false;
            }

            console.log('[Email] Rejection email sent successfully:', data?.id);
            return true;
        } catch (error) {
            console.error('[Email] Error sending rejection email:', error);
            return false;
        }
    }
};
