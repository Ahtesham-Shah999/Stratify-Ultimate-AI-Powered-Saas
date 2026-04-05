const { sendEmail } = require('../services/emailService');
const otpStore = {};
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
};

exports.sendOtp = async (req, res) => {
  try {
    console.log('sendOtp called with body:', req.body);
    const { email,Subject } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });


  const otp = generateOtp();
  otpStore[email] = otp;
    // send email
    await sendEmail({
      to: email,
      subject: Subject,
      text: `Your verification code is ${otp}`
    });
    return res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error sending OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
     const storedOtp = otpStore[email];

  if (storedOtp && storedOtp === otp) {
    delete otpStore[email];
    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
};
