import { Resend } from 'resend';

export const sendEmail = async ({ to, subject, text, html }) => {
  console.log('----------------------------------------------------');
  console.log(`[EMAIL SEND SIMULATOR]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log('----------------------------------------------------');

  // If Resend API key is configured, use Resend (works on Render - no SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM || 'onboarding@resend.dev',
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });

      if (error) {
        console.error(`Resend Error: ${error.message}`);
        return { simulated: true, to, subject };
      }

      console.log(`Real Email Sent via Resend: ${data.id}`);
      return data;
    } catch (error) {
      console.error(`Resend Send Error: ${error.message}`);
    }
  }
  
  return { simulated: true, to, subject };
};

export const sendOTP = async (phoneOrEmail, otp) => {
  const text = `Your BrandBondhu verification code is: ${otp}. This code is valid for 10 minutes.`;
  await sendEmail({
    to: phoneOrEmail.includes('@') ? phoneOrEmail : 'simulated-phone-sms@brandbondhu.local',
    subject: 'BrandBondhu Security Verification Code',
    text,
  });
  console.log(`[SMS/EMAIL VERIFICATION SIMULATOR] Sent OTP ${otp} to ${phoneOrEmail}`);
};
