import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendSupportInvitationEmail(
  recipientEmail: string,
  invitationToken: string,
  inviterName: string = "VeriFund Admin"
): Promise<boolean> {
  const domain = process.env.APP_URL || 'http://localhost:5000';
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const invitationLink = `${protocol}://${domain}/accept-support-invite/${invitationToken}`;
  
  const emailParams: EmailParams = {
    to: recipientEmail,
    from: 'noreply@verifund.com', // You might want to use a verified sender
    subject: '🎉 You\'ve been invited to join VeriFund as Support Staff!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">VeriFund</h1>
          <p style="color: #64748b; font-size: 18px;">Transparent Crowdfunding Platform</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-bottom: 15px;">🎉 Support Staff Invitation</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hello! You've been invited by <strong>${inviterName}</strong> to join VeriFund as a Support Staff member.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            As a Support Staff member, you'll have access to help users, manage support tickets, and assist with platform operations.
          </p>
          
          <div style="text-align: center;">
            <a href="${invitationLink}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ⏰ <strong>Important:</strong> This invitation will expire in 7 days. Please accept it as soon as possible.
          </p>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 14px;">
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>Need help? Contact us at support@verifund.com</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2025 VeriFund. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
You've been invited to join VeriFund as Support Staff!

Hello! You've been invited by ${inviterName} to join VeriFund as a Support Staff member.

As a Support Staff member, you'll have access to help users, manage support tickets, and assist with platform operations.

Click the following link to accept your invitation:
${invitationLink}

Important: This invitation will expire in 7 days. Please accept it as soon as possible.

If you didn't expect this invitation, you can safely ignore this email.

Need help? Contact us at support@verifund.com

© 2025 VeriFund. All rights reserved.
    `
  };
  
  return await sendEmail(emailParams);
}