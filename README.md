# QuickRX Pharmacy Website

A modern pharmacy website built with React, Vite, and Tailwind CSS, featuring prescription refill requests, transfers, and customer feedback forms.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server (frontend only)
npm run dev

# Start full stack development (frontend + backend)
npm run dev:full
```

The frontend will be available at `http://localhost:5173`

## 📧 Email System

This project uses Netlify Functions to handle form submissions and send emails via Gmail SMTP.

### Environment Variables

Create a `.env` file in the root directory with your Gmail credentials:

```env
# Email Configuration (Gmail) - Standard naming for Netlify
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Alternative email configuration (fallback)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Email Recipients
TO_EMAIL=info@quickrx134.com
EMAIL_TO=info@quickrx134.com

# SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Environment
NODE_ENV=development
```

**Important:** Use an App Password, not your regular Gmail password. [Learn how to create an App Password](https://support.google.com/accounts/answer/185833).

### Netlify Deployment

1. **Connect to Netlify:**
   - Push your code to GitHub
   - Connect your repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Configure Environment Variables in Netlify:**
   - Go to Site Settings > Environment Variables
   - Add the same variables from your `.env` file:
     - `SMTP_USER` (preferred) or `GMAIL_USER`
     - `SMTP_PASS` (preferred) or `GMAIL_APP_PASSWORD`
     - `TO_EMAIL` (preferred) or `EMAIL_TO`

3. **Deploy:**
   - Netlify will automatically deploy when you push to your main branch
   - Functions will be available at `/api/*` endpoints

### API Endpoints

All endpoints are available at `https://your-site.netlify.app/api/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Basic health check |
| `/api/health/email` | GET | Email system health check |
| `/api/contact` | POST | Contact form submission |
| `/api/refill` | POST | Prescription refill request |
| `/api/transfer` | POST | Prescription transfer request |
| `/api/feedback` | POST | Customer feedback submission |

### Testing

#### Local Testing
```bash
# Test email system
npm run test:email

# Simple email test
npm run test:email-simple
```

#### Production Testing
```bash
# Test health check
curl https://your-site.netlify.app/api/health

# Test email health check
curl https://your-site.netlify.app/api/health/email
```

### Custom Domain Setup

1. **Add Custom Domain in Netlify:**
   - Go to Site Settings > Domain Management
   - Add your custom domain (e.g., `quickrx134.com`)

2. **Update DNS:**
   - Point your domain's DNS to Netlify's nameservers
   - Or add CNAME records as instructed by Netlify

3. **SSL Certificate:**
   - Netlify automatically provides SSL certificates
   - Your site will be available at `https://quickrx134.com`

### Form Validation

All forms include:
- Required field validation
- Email format validation
- Rating validation (1-5 stars for feedback)
- Graceful error handling
- Success/error messages

### Email Features

- **Professional HTML templates** with QuickRX branding
- **Correlation IDs** for tracking submissions
- **Metadata** including page URL, timestamp, form type
- **Both HTML and text versions** for compatibility
- **Reply-to headers** for easy customer communication

### Troubleshooting

#### Email Not Sending
1. Check environment variables are set correctly (prefer `SMTP_USER`/`SMTP_PASS`)
2. Verify Gmail App Password is correct
3. Check Netlify function logs in the dashboard
4. Test with `/api/health/email` endpoint

#### CORS Issues
- Functions run on the same origin, so CORS shouldn't be an issue
- If you see CORS errors, check that requests are going to `/api/*` endpoints

#### Local Development
- Frontend development works with `npm run dev`
- Functions are only available in production or with `netlify dev`
- For full testing, use `npm run dev:full` to run both frontend and backend

## 📁 Project Structure

```
├── netlify/
│   └── functions/
│       ├── email.js           # Shared email utility
│       ├── health.js          # Health check endpoint
│       ├── health-email.js    # Email health check
│       ├── contact.js         # Contact form handler
│       ├── refill.js          # Refill form handler
│       ├── transfer.js        # Transfer form handler
│       └── feedback.js        # Feedback form handler
├── src/
│   ├── pages/                 # React components
│   ├── components/            # UI components
│   └── lib/                   # Utilities
├── api/                       # Legacy API endpoints (for local dev)
├── netlify.toml              # Netlify configuration
└── package.json
```

## 🔧 Development

### Adding New Forms

1. Create a new function in `netlify/functions/`
2. Import the shared email utility
3. Add validation and email sending logic
4. Update the frontend to call the new endpoint

### Styling

The project uses Tailwind CSS for styling. All components are in `src/components/ui/` and follow a consistent design system.

### State Management

Forms use React state and the `react-hook-form` library for form handling and validation. 