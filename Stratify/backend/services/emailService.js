// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//  service: 'gmail',
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   }
// });
// const wrapTemplate = (content) => `
//   <div style="
//       font-family: Arial, sans-serif;
//       max-width: 600px;
//       margin: auto;
//       padding: 20px;
//       background: #fafafa;
//       border-radius: 10px;
//       border: 1px solid #e0e0e0;
//     ">
    
//     <div style="text-align: center; padding-bottom: 10px;">
//       <h2 style="color:#1e3c72;">Stratify</h2>
//     </div>

//     <div style="font-size: 15px; color: #333;">
//       ${content}
//     </div>

//     <hr style="margin-top: 30px;">

//     <p style="text-align: center; color: #777; font-size: 12px;">
//       Stratify — AI Powered Trading Toolkit
//     </p>

//   </div>
// `;
// const sendEmail = async ({ to, subject, text, html }) => {
  
//   // If caller passes CUSTOM HTML → wrap it
//   let finalHtml = html
//     ? wrapTemplate(html)
//     : wrapTemplate(`<p>${text}</p>`); // convert plaintext to styled HTML

//   const mailOptions = {
//     from: process.env.SMTP_USER,
//     to,
//     subject,
//     text,
//     html: finalHtml
//   };
// console.log('Sending email to:', to);
//   return transporter.sendMail(mailOptions);
// };


// module.exports = { sendEmail };
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
 service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
const wrapTemplate = (content) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7fa; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            
            <!-- Header Section -->
            <tr>
              <td style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: 1px;">
                  Stratify
                </h1>
                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 400; letter-spacing: 0.5px;">
                  AI POWERED TRADING TOOLKIT
                </p>
              </td>
            </tr>

            <!-- Content Section -->
            <tr>
              <td style="padding: 40px 40px 32px 40px; text-align: center;">
                <div style="font-size: 15px; line-height: 1.7; color: #333333;">
                  ${content}
                </div>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 0 40px;">
                <div style="border-top: 1px solid #e5e7eb;"></div>
              </td>
            </tr>

            <!-- Footer Section -->
            <tr>
              <td style="padding: 24px 40px 32px 40px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                  This email was sent by <strong style="color: #1e3c72;">Stratify</strong>
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  AI Powered Trading Toolkit • Empowering Smart Trading Decisions
                </p>
              </td>
            </tr>

            <!-- Bottom Bar -->
            <tr>
              <td style="background-color: #f9fafb; padding: 16px 40px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                  © 2025-26 Stratify. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;
const sendEmail = async ({ to, subject, text, html }) => {
  
  // If caller passes CUSTOM HTML → wrap it
  let finalHtml = html
    ? wrapTemplate(html)
    : wrapTemplate(`<p>${text.replace(/Your verification code is/gi, '<strong style="font-weight: 900; color: #1e3c72;">Your verification code is</strong>')}</p>`); // convert plaintext to styled HTML

  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html: finalHtml
  };
console.log('Sending email to:', to);
  return transporter.sendMail(mailOptions);
};


module.exports = { sendEmail };