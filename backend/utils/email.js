import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  console.log('----------------------------------------------------');
  console.log(`[EMAIL SEND SIMULATOR]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log('----------------------------------------------------');

  // If credentials are configured in .env, attempt sending
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@brandbondhu.com',
        to,
        subject,
        text,
        html: html || text,
      });

      console.log(`Real Email Sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`SMTP Send Error: ${error.message}`);
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
