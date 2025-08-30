// src/lib/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/* ---------- helpers ---------- */
const envPick = (...names) => {
  for (const k of names) {
    const v = process.env[k];
    if (v && String(v).trim() !== '') return v;
  }
  return undefined;
};

const envBool = (v, d = false) => {
  if (v == null) return d;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
};

// Basic HTML escape for user-provided strings
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* ---------- transporter ---------- */
const createTransporter = () => {
  // Accept multiple naming schemes so local & Netlify are in sync
  const user = envPick('SMTP_USER', 'GMAIL_USER', 'EMAIL_USER');
  const pass = envPick('SMTP_PASS', 'GMAIL_APP_PASSWORD', 'EMAIL_PASS');

  if (!user || !pass) {
    throw new Error('SMTP_USER/SMTP_PASS (or GMAIL_USER/GMAIL_APP_PASSWORD) not set.');
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = envBool(process.env.SMTP_SECURE, false);

  return nodemailer.createTransport({
    host,
    port,
    secure,                        // true -> 465, false -> 587
    auth: { user, pass },
    tls: { ciphers: 'TLSv1.2' },
    // keep things snappy & resilient
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 30_000,
    socketTimeout: 30_000,
  });
};

/* ---------- core sender ---------- */
export async function sendPharmacyEmail({
  subject,
  html,
  text,
  formType = 'general',
  formData = {},
  pageUrl = '',
  timestamp = new Date().toISOString(),
  replyTo, // optional
}) {
  const transporter = createTransporter();

  const correlationId = `quickrx-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  const enhancedSubject = `[QuickRX ${formType.toUpperCase()}] ${subject}`;

  const enhancedHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background:#1e3a8a;color:#fff;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">QuickRX Pharmacy</h1>
        <p style="margin:6px 0 0;opacity:.9;">${esc(formType)} form submission</p>
      </div>
      <div style="padding:20px;background:#f8fafc;">${html}</div>
      <div style="background:#f1f5f9;padding:12px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
        <b>Page:</b> ${esc(pageUrl || 'N/A')} • <b>Time:</b> ${new Date(timestamp).toLocaleString()} • <b>CorrID:</b> ${correlationId}
      </div>
    </div>
  `;

  const enhancedText = `
QuickRX ${formType.toUpperCase()} Form

${text}

---
Page: ${pageUrl || 'N/A'}
Time: ${new Date(timestamp).toLocaleString()}
CorrID: ${correlationId}
  `.trim();

  const fromAddr =
    envPick('SMTP_USER', 'GMAIL_USER', 'EMAIL_USER') || 'no-reply@quickrx';
  const toAddr = process.env.TO_EMAIL || fromAddr;

  const mailOptions = {
    from: `"QuickRX Pharmacy" <${fromAddr}>`,
    to: toAddr,
    subject: enhancedSubject,
    text: enhancedText,
    html: enhancedHtml,
    replyTo: replyTo || undefined,
    headers: {
      'X-Correlation-ID': correlationId,
      'X-Form-Type': formType,
      'X-Submission-Timestamp': timestamp,
    },
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent (${formType})`, { correlationId, id: result.messageId });
  return { success: true, correlationId, messageId: result.messageId };
}

/* ---------- templates ---------- */

// CONTACT
export async function sendContactEmail(formData, pageUrl = '') {
  const { name, email, phone, message = '' } = formData;
  const html = `
    <h2 style="color:#1e3a8a;margin:0 0 12px;">Contact Form</h2>
    <p><b>Name:</b> ${esc(name)}</p>
    <p><b>Email:</b> ${esc(email)}</p>
    <p><b>Phone:</b> ${esc(phone || 'N/A')}</p>
    <p><b>Message:</b><br>${esc(message).replace(/\n/g, '<br>')}</p>
  `;
  const text = `Contact Form
Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}

${message}`;
  return sendPharmacyEmail({
    subject: `Contact form from ${name}`,
    html,
    text,
    formType: 'contact',
    formData,
    pageUrl,
    replyTo: email || undefined,
  });
}

// REFILL
export async function sendRefillEmail(formData, pageUrl = '') {
  const {
    firstName,
    lastName,
    dateOfBirth,
    phone,
    email,
    rxNumber,
    pickupMethod,
    pickupDate,
    additionalNotes = '',
  } = formData;

  const html = `
    <h2 style="color:#1e3a8a;margin:0 0 12px;">Prescription Refill</h2>
    <p><b>Patient:</b> ${esc(firstName)} ${esc(lastName)}</p>
    <p><b>DOB:</b> ${esc(dateOfBirth)}</p>
    <p><b>Phone:</b> ${esc(phone)}</p>
    ${email ? `<p><b>Email:</b> ${esc(email)}</p>` : ''}
    <p><b>RX #:</b> ${esc(rxNumber)}</p>
    <p><b>Pickup:</b> ${esc(pickupMethod || 'N/A')} ${pickupDate ? `on ${esc(pickupDate)}` : ''}</p>
    ${additionalNotes ? `<p><b>Notes:</b><br>${esc(additionalNotes).replace(/\n/g, '<br>')}</p>` : ''}
  `;
  const text = `Prescription Refill
Patient: ${firstName} ${lastName}
DOB: ${dateOfBirth}
Phone: ${phone}
${email ? `Email: ${email}\n` : ''}RX#: ${rxNumber}
Pickup: ${pickupMethod || 'N/A'} ${pickupDate ? `on ${pickupDate}` : ''}
${additionalNotes ? `Notes:\n${additionalNotes}` : ''}`;
  return sendPharmacyEmail({
    subject: `Refill for ${firstName} ${lastName}`,
    html,
    text,
    formType: 'refill',
    formData,
    pageUrl,
    replyTo: email || undefined,
  });
}

// TRANSFER
export async function sendTransferEmail(formData, pageUrl = '') {
  const {
    firstName,
    lastName,
    dateOfBirth,
    phone,
    email,
    currentPharmacy,
    pharmacyPhone,
    prescriptionNames,
    prescriptionNumbers,
    additionalInfo = '',
  } = formData;

  const html = `
    <h2 style="color:#1e3a8a;margin:0 0 12px;">Transfer Request</h2>
    <p><b>Patient:</b> ${esc(firstName)} ${esc(lastName)} (${esc(dateOfBirth)})</p>
    <p><b>Phone:</b> ${esc(phone)}</p>
    ${email ? `<p><b>Email:</b> ${esc(email)}</p>` : ''}
    <p><b>From:</b> ${esc(currentPharmacy)} (${esc(pharmacyPhone || 'N/A')})</p>
    <p><b>Prescriptions:</b> ${esc(prescriptionNames || 'N/A')} (${esc(prescriptionNumbers || 'N/A')})</p>
    ${additionalInfo ? `<p><b>Info:</b><br>${esc(additionalInfo).replace(/\n/g, '<br>')}</p>` : ''}
  `;
  const text = `Transfer Request
Patient: ${firstName} ${lastName}
DOB: ${dateOfBirth}
Phone: ${phone}
${email ? `Email: ${email}\n` : ''}From: ${currentPharmacy} (${pharmacyPhone || 'N/A'})
Prescriptions: ${prescriptionNames || 'N/A'} (${prescriptionNumbers || 'N/A'})
${additionalInfo ? `Info:\n${additionalInfo}` : ''}`;
  return sendPharmacyEmail({
    subject: `Transfer for ${firstName} ${lastName}`,
    html,
    text,
    formType: 'transfer',
    formData,
    pageUrl,
    replyTo: email || undefined,
  });
}

// FEEDBACK
export async function sendFeedbackEmail(formData, pageUrl = '') {
  const { rating, feedback, name, email } = formData;
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const html = `
    <h2 style="color:#1e3a8a;margin:0 0 12px;">Customer Feedback</h2>
    <p><b>Rating:</b> <span style="color:#f59e0b;font-size:20px">${esc(stars)}</span> (${esc(rating)}/5)</p>
    ${name ? `<p><b>Name:</b> ${esc(name)}</p>` : ''}
    ${email ? `<p><b>Email:</b> ${esc(email)}</p>` : ''}
    <p><b>Feedback:</b><br>${esc(feedback || '').replace(/\n/g, '<br>')}</p>
  `;
  const text = `Customer Feedback
Rating: ${stars} (${rating}/5)
${name ? `Name: ${name}\n` : ''}${email ? `Email: ${email}\n` : ''}

${feedback || ''}`;
  return sendPharmacyEmail({
    subject: `Customer Feedback - ${rating}/5`,
    html,
    text,
    formType: 'feedback',
    formData,
    pageUrl,
    replyTo: email || undefined,
  });
}

// HEALTH CHECK
export async function sendHealthCheckEmail() {
  const html = `<p>✅ QuickRX email system OK.</p>`;
  const text = `QuickRX email system OK.`;
  return sendPharmacyEmail({
    subject: 'QuickRX Email Health Check',
    html,
    text,
    formType: 'health-check',
    pageUrl: '/api/health/email',
  });
}