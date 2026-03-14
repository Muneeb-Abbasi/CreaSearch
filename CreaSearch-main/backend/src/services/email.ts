import { Resend } from 'resend';
import { getSupabaseClient } from './database';
import { logger } from '../utils/logger';

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
            logger.error('[Email] Error fetching user email:', error);
            return null;
        }

        return data?.user?.email || null;
    } catch (error) {
        logger.error('[Email] Failed to get user email:', error);
        return null;
    }
}

// Configurable FROM_EMAIL: use env variable or fall back to Resend test domain
const FROM_EMAIL = process.env.FROM_EMAIL || 'Creasearch <dev@pakistanrecruitment.com>';

// Shared email header/footer for consistent branding
const emailHeader = `
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10B981; margin: 0; font-size: 28px;">Creasearch</h1>
    </div>
`;

const emailFooter = `
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
    <p style="color: #9CA3AF; font-size: 14px; text-align: center;">
        © ${new Date().getFullYear()} Creasearch. Pakistan's Creator Discovery Platform.
    </p>
`;

function wrapEmailBody(content: string): string {
    return `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            ${emailHeader}
            ${content}
            ${emailFooter}
        </div>
    `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
        const resend = getResendClient();
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });

        if (error) {
            logger.error('[Email] Resend API error:', error);
            return false;
        }

        logger.info('[Email] Sent successfully:', { id: data?.id, to });
        return true;
    } catch (error) {
        logger.error('[Email] Error sending email:', error);
        return false;
    }
}

export const emailService = {
    // ─── Profile Emails ────────────────────────────────────────

    async sendProfileApprovedEmail(userId: string, name: string): Promise<boolean> {
        const email = await getUserEmail(userId);
        if (!email) {
            logger.info('[Email] No email found for user:', userId);
            return false;
        }

        const html = wrapEmailBody(`
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
        `);

        return sendEmail(email, '🎉 Your Creasearch Profile is Approved!', html);
    },

    async sendProfileRejectedEmail(userId: string, name: string, reason?: string): Promise<boolean> {
        const email = await getUserEmail(userId);
        if (!email) {
            logger.info('[Email] No email found for user:', userId);
            return false;
        }

        const html = wrapEmailBody(`
            <h2 style="color: #1F2937; margin-bottom: 20px;">Hi ${name},</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in joining Creasearch. After reviewing your profile, 
                we weren't able to approve it at this time.
            </p>
            
            ${reason ? `
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #92400E; font-size: 14px; margin: 0;"><strong>Feedback:</strong> ${reason}</p>
            </div>
            ` : ''}
            
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
        `);

        return sendEmail(email, 'Update on Your Creasearch Profile Application', html);
    },


    async sendProfileSubmittedEmail(userId: string, name: string): Promise<boolean> {
        const email = await getUserEmail(userId);
        if (!email) {
            logger.info('[Email] No email found for user:', userId);
            return false;
        }

        const html = wrapEmailBody(`
            <h2 style="color: #1F2937; margin-bottom: 20px;">Profile Submitted! 📩</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Hi ${name}, your creator profile has been submitted and is now under review 
                by our team. We'll notify you once it's been reviewed.
            </p>
            
            <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #1E40AF; font-size: 14px; margin: 0;"><strong>What happens next?</strong></p>
                <ul style="color: #1E40AF; font-size: 14px; margin: 8px 0 0 0; padding-left: 20px;">
                    <li>Our team will review your profile within 24-48 hours</li>
                    <li>You'll receive an email once your profile is approved or if changes are needed</li>
                    <li>Your social media accounts will be verified in the background</li>
                </ul>
            </div>
        `);

        return sendEmail(email, '📩 Profile Submitted — Creasearch', html);
    },

    // ─── Collaboration Emails ──────────────────────────────────

    async sendCollaborationApprovedEmail(
        userId: string,
        profileName: string,
        partnerName: string,
        description: string
    ): Promise<boolean> {
        const email = await getUserEmail(userId);
        if (!email) {
            logger.info('[Email] No email found for user:', userId);
            return false;
        }

        const html = wrapEmailBody(`
            <h2 style="color: #1F2937; margin-bottom: 20px;">Collaboration Approved! 🤝</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                Great news! Your collaboration between <strong>${profileName}</strong> and 
                <strong>${partnerName}</strong> has been verified and approved.
            </p>
            
            <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #166534; font-size: 14px; margin: 0;"><strong>Collaboration:</strong> ${description}</p>
            </div>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                This collaboration has been added to both profiles and your Creasearch Score has been updated accordingly.
            </p>
            
            <div style="margin: 30px 0; text-align: center;">
                <a href="https://creasearch.com/search" 
                   style="background-color: #10B981; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: 600;
                          display: inline-block;">
                    View Your Profile
                </a>
            </div>
        `);

        return sendEmail(email, '🤝 Collaboration Approved — Creasearch', html);
    },

    async sendCollaborationRejectedEmail(
        userId: string,
        profileName: string,
        partnerName: string,
        description: string,
        adminNotes?: string
    ): Promise<boolean> {
        const email = await getUserEmail(userId);
        if (!email) {
            logger.info('[Email] No email found for user:', userId);
            return false;
        }

        const html = wrapEmailBody(`
            <h2 style="color: #1F2937; margin-bottom: 20px;">Collaboration Update</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                The collaboration request between <strong>${profileName}</strong> and 
                <strong>${partnerName}</strong> was not approved after review.
            </p>
            
            <div style="background-color: #F3F4F6; border-left: 4px solid #9CA3AF; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Collaboration:</strong> ${description}</p>
            </div>
            
            ${adminNotes ? `
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #92400E; font-size: 14px; margin: 0;"><strong>Admin feedback:</strong> ${adminNotes}</p>
            </div>
            ` : ''}
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                <strong>Common reasons for rejection:</strong><br>
                • Insufficient proof of collaboration<br>
                • Description doesn't clearly describe the collaboration<br>
                • The collaboration doesn't meet our guidelines
            </p>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                You can submit a new collaboration request with updated details and supporting proof.
            </p>
        `);

        return sendEmail(email, 'Collaboration Update — Creasearch', html);
    },

    // ─── New Collaboration Request Notification ────────────────

    async sendNewCollaborationRequestEmail(
        userId: string,
        partnerName: string,
        requesterName: string,
        description: string
    ): Promise<boolean> {
        const email = await getUserEmail(userId);
        if (!email) {
            logger.info('[Email] No email found for user:', userId);
            return false;
        }

        const html = wrapEmailBody(`
            <h2 style="color: #1F2937; margin-bottom: 20px;">New Collaboration Request 📬</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                <strong>${requesterName}</strong> has submitted a collaboration request 
                involving your profile <strong>${partnerName}</strong>.
            </p>
            
            <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #1E40AF; font-size: 14px; margin: 0;"><strong>Description:</strong> ${description}</p>
            </div>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
                This request is currently pending admin review and will be approved once verified.
            </p>
        `);

        return sendEmail(email, '📬 New Collaboration Request — Creasearch', html);
    },
};
