const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { logAuditEvent } = require('../middleware/auditLogger');

const router = express.Router();

// Register new user (with rate limiting and strict validation)
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, email, password, role = 'student', student_id, phone, department } = req.body;

    const validRoles = ['student', 'admin', 'staff'];
    const assignedRole = validRoles.includes(role) ? role : 'student';

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      logAuditEvent({
        userEmail: email,
        action: 'REGISTER_FAILED_DUPLICATE',
        ipAddress: req.ip,
        details: 'Attempted to register with an already existing email address.'
      });
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      department: department || null,
      student_id: student_id || null,
      phone: phone || null
    });

    const user = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      student_id: newUser.student_id,
      phone: newUser.phone
    };

    logAuditEvent({
      userId: newUser._id,
      userEmail: email,
      action: 'REGISTER_SUCCESS',
      ipAddress: req.ip,
      details: { role: assignedRole, department }
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Account registered successfully.',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register account. Please try again.' });
  }
});

// Login (with brute-force protection and validation)
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const userDoc = await User.findOne({ email: email.toLowerCase() });
    if (!userDoc) {
      logAuditEvent({
        userEmail: email,
        action: 'LOGIN_FAILURE_USER_NOT_FOUND',
        ipAddress: req.ip,
        details: 'Invalid login attempt - account does not exist.'
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      logAuditEvent({
        userId: userDoc._id,
        userEmail: email,
        action: 'LOGIN_FAILURE_WRONG_PASSWORD',
        ipAddress: req.ip,
        details: 'Failed password verification.'
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      department: userDoc.department,
      student_id: userDoc.student_id,
      phone: userDoc.phone,
      avatar: userDoc.avatar
    };

    logAuditEvent({
      userId: userDoc._id,
      userEmail: email,
      action: 'LOGIN_SUCCESS',
      ipAddress: req.ip,
      details: { role: userDoc.role }
    });

    const token = generateToken(safeUser);
    res.json({
      message: 'Logged in successfully.',
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user profile
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Get available staff members for assignment
router.get('/staff', requireAuth, async (req, res) => {
  try {
    const staffDocs = await User.find({ role: { $in: ['staff', 'admin'] } })
      .select('id name email department role')
      .lean();

    const staff = staffDocs.map(s => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      department: s.department,
      role: s.role
    }));

    res.json({ staff });
  } catch (error) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ error: 'Failed to retrieve staff directory.' });
  }
});

module.exports = router;
