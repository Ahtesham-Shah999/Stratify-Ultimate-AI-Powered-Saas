const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate=require('../middleware/authroles')
// POST /api/auth/send-otp  input from frontend: email,Subject
router.post('/send-otp/:role', validate.validateRole,authController.sendOtp);
// POST /api/auth/verify-otp  input from frontend:  email, otp 
router.post('/verify-otp/:role',validate.validateRole,authController.verifyOtp);
module.exports = router;
