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

  const { 
    firstName, lastName, dateOfBirth, phone, email,
    rxNumber, pickupMethod, pickupDate, additionalNotes 
  } = body;

  // Basic validation
  if (!firstName || !lastName || !dateOfBirth || !phone || !rxNumber) {
    return createResponse(400, {
      ok: false,
      error: 'Missing required fields: firstName, lastName, dateOfBirth, phone, and rxNumber are required'
    });
  }

  // Email validation if provided
  if (email && !isValidEmail(email)) {
    return createResponse(400, {
      ok: false,
      error: 'Invalid email format'
    });
  }

  try {
    const html = `
      <h2 style="color: #1e3a8a; margin-bottom: 20px;">Prescription Refill Request</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Patient Information</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Date of Birth:</strong> ${dateOfBirth}</p>
        <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
        ${email ? `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ''}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Prescription Details</h3>
        <p><strong>RX Number:</strong> ${rxNumber}</p>
        <p><strong>Pickup Method:</strong> ${pickupMethod || 'Not specified'}</p>
        ${pickupDate ? `<p><strong>Preferred Pickup Date:</strong> ${pickupDate}</p>` : ''}
      </div>
      
      ${additionalNotes ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin-bottom: 10px;">Additional Notes</h3>
          <div style="background: white; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">
            ${additionalNotes.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : ''}
    `;

    const text = `
Patient Information:
Name: ${firstName} ${lastName}
Date of Birth: ${dateOfBirth}
Phone: ${phone}
${email ? `Email: ${email}` : ''}

Prescription Details:
RX Number: ${rxNumber}
Pickup Method: ${pickupMethod || 'Not specified'}
${pickupDate ? `Preferred Pickup Date: ${pickupDate}` : ''}

${additionalNotes ? `Additional Notes:\n${additionalNotes}` : ''}
    `.trim();

    const result = await sendPharmacyEmail({
      subject: `Refill Request for ${firstName} ${lastName}`,
      html,
      text,
      formType: 'refill',
      formData: { firstName, lastName, dateOfBirth, phone, email, rxNumber, pickupMethod, pickupDate, additionalNotes },
      pageUrl: event.headers.referer || 'Not provided',
      replyTo: email ? `${firstName} ${lastName} <${email}>` : null
    });

    return createResponse(200, {
      ok: true,
      success: true,
      message: 'Refill request submitted successfully',
      correlationId: result.correlationId,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Refill email sending failed:', error);
    return createResponse(500, {
      ok: false,
      error: 'Failed to submit refill request. Please try again later.'
    });
  }
} 