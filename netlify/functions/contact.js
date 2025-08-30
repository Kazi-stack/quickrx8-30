import { createResponse, sendPharmacyEmail, isValidEmail } from './_email.js';

export async function handler(event, context) {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(204, {});
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { 
      ok: false, 
      error: 'Method not allowed' 
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return createResponse(400, {
      ok: false,
      error: 'Invalid JSON in request body'
    });
  }

  const { name, email, phone, message } = body;

  // Basic validation
  if (!name || !email || !message) {
    return createResponse(400, {
      ok: false,
      error: 'Missing required fields: name, email, and message are required'
    });
  }

  // Email validation
  if (!isValidEmail(email)) {
    return createResponse(400, {
      ok: false,
      error: 'Invalid email format'
    });
  }

  try {
    const html = `
      <h2 style="color: #1e3a8a; margin-bottom: 20px;">Contact Form Submission</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Message</h3>
        <div style="background: white; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;

    const text = `
Contact Information:
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Message:
${message}
    `.trim();

    const result = await sendPharmacyEmail({
      subject: `Contact Form from ${name}`,
      html,
      text,
      formType: 'contact',
      formData: { name, email, phone, message },
      pageUrl: event.headers.referer || 'Not provided',
      replyTo: `${name} <${email}>`
    });

    return createResponse(200, {
      ok: true,
      success: true,
      message: 'Contact form submitted successfully',
      correlationId: result.correlationId,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Contact email sending failed:', error);
    return createResponse(500, {
      ok: false,
      error: 'Failed to submit contact form. Please try again later.'
    });
  }
} 