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
   * Sends order confirmation email
   */
  async sendOrderConfirmation({ email, customerName, orderNumber, items = [], totalAmount }) {
    const subject = `Order confirmation: ${orderNumber}`;
    const html = this.getOrderConfirmationTemplate({
      customerName,
      orderNumber,
      items,
      totalAmount,
    });
    const text = this.getOrderConfirmationText({
      customerName,
      orderNumber,
      items,
      totalAmount,
    });
    const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL
      || process.env.SMTP_FROM
      || process.env.SMTP_USER;
    const bcc = notificationEmail && notificationEmail !== email ? notificationEmail : undefined;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shopu.ge',
        to: email,
        bcc,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw new Error('Failed to send order confirmation email');
    }
  }

  /**
   * Sends order notification email to store owner
   */
  async sendOrderNotificationToOwner({ email, customerName, orderNumber, items = [], totalAmount, dashboardOrderUrl }) {
    const subject = `New order received: ${orderNumber}`;
    const html = this.getOwnerOrderNotificationTemplate({
      customerName,
      orderNumber,
      items,
      totalAmount,
      dashboardOrderUrl,
    });
    const text = this.getOwnerOrderNotificationText({
      customerName,
      orderNumber,
      items,
      totalAmount,
      dashboardOrderUrl,
    });

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
      console.error('Error sending owner order notification email:', error);
      throw new Error('Failed to send owner order notification email');
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

  getOrderConfirmationTemplate({ customerName, orderNumber, items, totalAmount }) {
    const safeName = customerName || 'Customer';
    const rows = items
      .map((item) => {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        return `
          <tr>
            <td style="padding: 8px 0;">${item.title} ${item.variantData ? `(${this.formatVariant(item.variantData)})` : ''}</td>
            <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; text-align: right;">$${lineTotal}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { margin-bottom: 16px; }
          .summary { background: #f7f7f7; padding: 12px 16px; border-radius: 8px; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 12px; color: #666; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
          .total { text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Thanks for your order, ${safeName}!</h2>
            <p>Your order <strong>${orderNumber}</strong> has been received.</p>
          </div>
          <div class="summary">
            <div><strong>Order summary</strong></div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="total">Order total: $${Number(totalAmount || 0).toFixed(2)}</div>
          </div>
          <div class="footer"></div>
        </div>
      </body>
      </html>
    `;
  }

  getOrderConfirmationText({ customerName, orderNumber, items, totalAmount }) {
    const safeName = customerName || 'Customer';
    const lines = items.map((item) => {
      const variant = item.variantData ? ` (${this.formatVariant(item.variantData)})` : '';
      const lineTotal = (item.price * item.quantity).toFixed(2);
      return `- ${item.title}${variant} x${item.quantity}: $${lineTotal}`;
    });

    return [
      `Thanks for your order, ${safeName}!`,
      `Order: ${orderNumber}`,
      '',
      'Items:',
      ...lines,
      '',
      `Order total: $${Number(totalAmount || 0).toFixed(2)}`,
      '',
    ].join('\n');
  }

  getOwnerOrderNotificationTemplate({ customerName, orderNumber, items, totalAmount, dashboardOrderUrl }) {
    const safeName = customerName || 'Customer';
    const rows = items
      .map((item) => {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        return `
          <tr>
            <td style="padding: 8px 0;">${item.title} ${item.variantData ? `(${this.formatVariant(item.variantData)})` : ''}</td>
            <td style="padding: 8px 0; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px 0; text-align: right;">$${lineTotal}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { margin-bottom: 16px; }
          .summary { background: #f7f7f7; padding: 12px 16px; border-radius: 8px; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 12px; color: #666; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
          .total { text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New order received</h2>
            <p>Order <strong>${orderNumber}</strong> was placed by ${safeName}.</p>
          </div>
          <div class="summary">
            <div><strong>Order summary</strong></div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <div class="total">Order total: $${Number(totalAmount || 0).toFixed(2)}</div>
          </div>
          <div class="footer">
            ${dashboardOrderUrl ? `<p><a href="${dashboardOrderUrl}">Open this order in your dashboard</a></p>` : '<p>Open your dashboard to view the full order details.</p>'}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getOwnerOrderNotificationText({ customerName, orderNumber, items, totalAmount, dashboardOrderUrl }) {
    const safeName = customerName || 'Customer';
    const lines = items.map((item) => {
      const variant = item.variantData ? ` (${this.formatVariant(item.variantData)})` : '';
      const lineTotal = (item.price * item.quantity).toFixed(2);
      return `- ${item.title}${variant} x${item.quantity}: $${lineTotal}`;
    });

    return [
      'New order received',
      `Order: ${orderNumber}`,
      `Customer: ${safeName}`,
      '',
      'Items:',
      ...lines,
      '',
      `Order total: $${Number(totalAmount || 0).toFixed(2)}`,
      '',
      dashboardOrderUrl ? `Open this order: ${dashboardOrderUrl}` : 'Open your dashboard to view the full order details.',
    ].join('\n');
  }

  formatVariant(variantData) {
    if (!variantData || typeof variantData !== 'object') return '';
    return Object.entries(variantData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
}
