import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    // Create transporter - using environment variables for configuration
    // For development, you can use a service like Ethereal Email or configure SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // For development/testing without SMTP configured, use a mock transporter
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('EmailService: SMTP credentials not configured. Emails will be logged to console.');
      this.transporter = {
        sendMail: async (options) => {
          console.log('=== EMAIL (MOCK) ===');
          console.log('To:', options.to);
          console.log('Subject:', options.subject);
          console.log('Body:', options.text || options.html);
          console.log('===================');
          return { messageId: 'mock-' + Date.now() };
        },
      };
    }
  }

  /**
   * Sends an email verification code
   */
  async sendVerificationCode(email, code, type = 'EMAIL_CONFIRMATION') {
    const subject = type === 'EMAIL_CONFIRMATION' 
      ? 'Verify Your Email Address'
      : 'Password Reset Code';

    const html = type === 'EMAIL_CONFIRMATION'
      ? this.getEmailConfirmationTemplate(code)
      : this.getPasswordResetTemplate(code);

    const text = type === 'EMAIL_CONFIRMATION'
      ? `Your email verification code is: ${code}\n\nPlease enter this code to verify your email address.`
      : `Your password reset code is: ${code}\n\nPlease enter this code to reset your password.`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shopu.ge',
        to: email,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Email confirmation template
   */
  getEmailConfirmationTemplate(code) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; 
                  background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with Shopu.ge! Please use the following code to verify your email address:</p>
          <div class="code">${code}</div>
          <p>This code will expire in 15 minutes.</p>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset template
   */
  getPasswordResetTemplate(code) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; 
                  background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Please use the following code to proceed:</p>
          <div class="code">${code}</div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <div class="footer">
            <p>For security reasons, never share this code with anyone.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
