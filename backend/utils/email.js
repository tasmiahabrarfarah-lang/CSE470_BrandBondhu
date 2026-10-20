import * as Brevo from '@getbrevo/brevo';

export const sendEmail = async ({ to, subject, text, html }) => {
  console.log('----------------------------------------------------');
  console.log(`[EMAIL SEND SIMULATOR]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log('----------------------------------------------------');

  // If Brevo API key is configured, use Brevo HTTP API (works on Render - no SMTP port blocking)
  if (process.env.BREVO_API_KEY) {
    try {
      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.sender = {
        email: process.env.BREVO_FROM_EMAIL || 'noreply@gmail.com',
        name: process.env.BREVO_FROM_NAME || 'BrandBondhu',
      };
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.textContent = text;
      sendSmtpEmail.htmlContent = html || `<p>${text}</p>`;

      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Real Email Sent via Brevo: ${result.body.messageId}`);
      return result;
    } catch (error) {
      console.error(`Brevo Send Error: ${error.message}`);
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
