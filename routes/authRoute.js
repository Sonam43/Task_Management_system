const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Signup & Login
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/verify-email', authController.verifyEmail);
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// Forgot Password Flow
router.get('/forgot-password', authController.getForgotPassword);       // Form to input email
router.post('/forgot-password', authController.postForgotPassword);     // Sends reset link
router.get('/reset-password/:token', authController.getResetPassword);  // Form to reset password
router.post('/reset-password/:token', authController.postResetPassword); // Handles reset

module.exports = router;
