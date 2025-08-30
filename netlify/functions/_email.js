import nodemailer from 'nodemailer';

// Build a Gmail/SMTP transporter from environment variables
const createTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD (or EMAIL_USER and EMAIL_PASS) not set. Check your Netlify environment variables.');
  }

  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { ciphers: 'TLSv1.2' },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

export async function sendPharmacyEmail({
  subject,
  html,
  text,
  formType = 'general',
  formData = {},
  pageUrl = '',
  timestamp = new Date().toISOString(),
  replyTo = null,
}) {
  const transporter = createTransporter();

  const correlationId = `quickrx-${formType}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const enhancedSubject = `[QuickRX ${formType.toUpperCase()}] ${subject}`;

  const enhancedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">QuickRX Pharmacy</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${formType} form submission</p>
      </div>
      <div style="padding: 20px; background: #f8fafc;">${html}</div>
      <div style="background: #f1f5f9; padding: 15px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 5px 0;"><strong>Submission Details:</strong></p>
        <p style="margin: 0 0 5px 0;">Form Type: ${formType}</p>
        <p style="margin: 0 0 5px 0;">Page URL: ${pageUrl || 'Not provided'}</p>
        <p style="margin: 0 0 5px 0;">Timestamp: ${new Date(timestamp).toLocaleString()}</p>
        <p style="margin: 0 0 5px 0;">Correlation ID: ${correlationId}</p>
      </div>
    </div>
  `;

  const enhancedText = `
QuickRX ${formType.toUpperCase()} Form

${text}

---
Submission Details:
Form Type: ${formType}
Page URL: ${pageUrl || 'Not provided'}
Timestamp: ${new Date(timestamp).toLocaleString()}
Correlation ID: ${correlationId}
  `.trim();

  const fromAddr = user;
  const toAddr = process.env.EMAIL_TO || user;

  const mailOptions = {
    from: `"QuickRX Pharmacy" <${fromAddr}>`,
    to: toAddr,
    subject: enhancedSubject,
    text: enhancedText,
    html: enhancedHtml,
    headers: {
      'X-Correlation-ID': correlationId,
      'X-Form-Type': formType,
      'X-Submission-Timestamp': timestamp,
    },
  };

  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  const result = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent (${formType})`, { correlationId, id: result.messageId });
  return { success: true, correlationId, messageId: result.messageId };
}

// Helper function to validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to create consistent JSON responses
export function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(data),
  };
} 