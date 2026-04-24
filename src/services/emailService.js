/* ──────────────────────────────────────────────
   Email Service — EmailJS Integration
   
   FREE: 200 emails/month on EmailJS free tier
   
   Setup instructions:
   1. Create account at https://www.emailjs.com
   2. Add an email service (Gmail, Outlook, etc.)
   3. Create an email template with variables:
      - {{to_email}} — recipient email
      - {{otp_code}} — the 6-digit OTP
      - {{app_name}} — "ReviewHub"
      - {{expiry_minutes}} — "5"
   4. Copy Service ID, Template ID, and Public Key
   5. Add to your .env file:
      VITE_EMAILJS_SERVICE_ID=your_service_id
      VITE_EMAILJS_TEMPLATE_ID=your_template_id
      VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ────────────────────────────────────────────── */

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Send OTP email using EmailJS REST API (no SDK needed)
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendOtpEmail = async (toEmail, otp) => {
  // Validate configuration
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    console.error('EmailJS is not configured. Add VITE_EMAILJS_* vars to .env');
    return {
      success: false,
      error: 'Email service not configured. Please contact support.',
    };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          otp_code: otp,
          app_name: 'ReviewHub',
          expiry_minutes: '5',
        },
      }),
    });

    if (response.ok || response.status === 200) {
      return { success: true };
    }

    const errorText = await response.text();
    console.error('EmailJS error:', errorText);
    return {
      success: false,
      error: 'Failed to send email. Please try again.',
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

/**
 * Check if EmailJS is configured
 */
export const isEmailServiceConfigured = () => {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};
