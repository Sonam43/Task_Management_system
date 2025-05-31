const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');  // For token expiration check
const User = require('../models/user');

// Create reusable transporter for email sending
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// GET: Signup Page
exports.getSignup = (req, res) => {
  res.render('signup');
};

// POST: Signup Handler
exports.postSignup = async (req, res) => {
  const { Name, email, password } = req.body;

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).send('User already exists. Please login.');
    }

    const hash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with verification token and isVerified flag false
    await User.create({
      Name,
      email,
      password: hash,
      verificationToken,
      isVerified: false,
    });

    // Send verification email
    const verifyUrl = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${verificationToken}&email=${email}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <p>Hi ${Name},</p>
        <p>Thanks for registering. Please verify your email by clicking on the link below:</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.render('verify-message', { email });

  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).send('Signup failed');
  }
};

// GET: Email Verification Handler
exports.verifyEmail = async (req, res) => {
  const { token, email } = req.query;

  try {
    const user = await User.findOne({ where: { email, verificationToken: token } });

    if (!user) {
      return res.status(400).send('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.render('verify-success');

  } catch (error) {
    console.error('Email Verification Error:', error.message);
    res.status(500).send('Verification failed');
  }
};

// GET: Login Page
exports.getLogin = (req, res) => {
  res.render('login');
};

// POST: Login Handler
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).send('User not found');

    if (!user.isVerified) {
      return res.status(401).send('Please verify your email before logging in.');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('Incorrect password');

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true });

    res.redirect('/tasks');
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).send('Login failed');
  }
};

// Logout Handler
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};

/* ====== FORGOT PASSWORD FLOW STARTS HERE ====== */

// GET: Forgot Password Page
exports.getForgotPassword = (req, res) => {
  res.render('forgot-password');
};

// POST: Forgot Password Handler
exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).send('No account with that email found.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour expiry

    // Save token and expiry in DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Construct reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;

    // Send email with reset link
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the link below to reset it:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    });

    res.send('Password reset link sent to your email.');

  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).send('Something went wrong');
  }
};

// GET: Reset Password Page
exports.getResetPassword = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired.');
    }

    res.render('reset-password', { token });

  } catch (error) {
    console.error('Get Reset Password Error:', error.message);
    res.status(500).send('Something went wrong');
  }
};

// POST: Reset Password Handler
exports.postResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.send('Password has been reset successfully. You can now log in.');

  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).send('Something went wrong');
  }
};
