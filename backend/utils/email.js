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
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: process.env.BREVO_FROM_EMAIL || 'noreply@gmail.com',
            name: process.env.BREVO_FROM_NAME || 'BrandBondhu',
          },
          to: [{ email: to }],
          subject,
          textContent: text,
          htmlContent: html || `<p>${text}</p>`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Brevo Send Error: ${JSON.stringify(data)}`);
        return { simulated: true, to, subject };
      }

      console.log(`Real Email Sent via Brevo: ${data.messageId}`);
      return data;
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
