import nodemailer from 'nodemailer';
import env from './env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: MailOptions): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM || 'StyleVerse <noreply@styleverse.com>',
    to: Array.isArray(options.to) ? options.to.join(',') : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
};

// Email templates

export const orderConfirmationEmail = (orderNumber: string, customerName: string, total: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1E 100%); padding: 40px; text-align: center; }
    .logo { color: #C9A84C; font-size: 28px; font-weight: 700; letter-spacing: 2px; }
    .body { padding: 40px; }
    .order-badge { background: #f0f9ff; border: 2px solid #C9A84C; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .order-number { font-size: 24px; font-weight: 700; color: #0A0A0A; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #C9A84C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✦ STYLEVERSE</div>
      <p style="color: #999; margin: 8px 0 0;">Wear Your World</p>
    </div>
    <div class="body">
      <h2 style="color: #0A0A0A;">Thank you, ${customerName}! 🎉</h2>
      <p style="color: #555; line-height: 1.6;">Your order has been confirmed and we're getting it ready for you.</p>
      <div class="order-badge">
        <p style="color: #666; margin: 0 0 8px;">Order Number</p>
        <div class="order-number">${orderNumber}</div>
        <p style="color: #C9A84C; font-weight: 600; margin: 8px 0 0;">Total: ₹${total.toLocaleString('en-IN')}</p>
      </div>
      <p style="color: #555;">You'll receive tracking updates via email and SMS. Expected delivery in 3-7 business days.</p>
      <a href="${env.CLIENT_URL}/orders/${orderNumber}" class="btn">Track Your Order →</a>
    </div>
    <div class="footer">
      <p>© 2024 StyleVerse. All rights reserved.</p>
      <p>Questions? Email us at <a href="mailto:support@styleverse.com">support@styleverse.com</a></p>
    </div>
  </div>
</body>
</html>
`;

export const passwordResetEmail = (resetUrl: string, name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0A0A0A 0%, #1C1C1E 100%); padding: 40px; text-align: center; }
    .logo { color: #C9A84C; font-size: 28px; font-weight: 700; letter-spacing: 2px; }
    .body { padding: 40px; }
    .btn { display: inline-block; background: #C9A84C; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✦ STYLEVERSE</div>
    </div>
    <div class="body">
      <h2 style="color: #0A0A0A;">Reset Your Password</h2>
      <p style="color: #555;">Hi ${name},</p>
      <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p style="color: #999; font-size: 13px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2024 StyleVerse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const vendorApprovalEmail = (vendorName: string, storeName: string, approved: boolean) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: #0A0A0A; padding: 30px; text-align: center;">
      <span style="color: #C9A84C; font-size: 24px; font-weight: 700;">✦ STYLEVERSE</span>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #0A0A0A;">Vendor ${approved ? 'Approved' : 'Update'} – ${storeName}</h2>
      <p>Hi ${vendorName},</p>
      ${approved
        ? `<p style="color: #555;">Congratulations! Your vendor application for <strong>${storeName}</strong> has been <span style="color: green; font-weight: bold;">approved</span>. You can now log in and start adding products to StyleVerse!</p>
           <a href="${env.CLIENT_URL}/vendor/dashboard" style="display: inline-block; background: #C9A84C; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">Go to Dashboard →</a>`
        : `<p style="color: #555;">We're sorry, but your vendor application for <strong>${storeName}</strong> has been reviewed. Please contact support for more information.</p>`
      }
    </div>
  </div>
</body>
</html>
`;

export default transporter;
