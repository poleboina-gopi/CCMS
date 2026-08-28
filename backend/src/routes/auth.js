const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../db');
const { generateToken, requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { logAuditEvent } = require('../middleware/auditLogger');

const router = express.Router();

// Register new student account (Public signup is strictly limited to Students)
router.post('/register', authLimiter, validateRegister, async (req, res) => {
  try {
    const { name, email, password, student_id, phone } = req.body;

    // Security Enforcement: All public self-registrations are strictly 'student'
    const assignedRole = 'student';

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
      department: null,
      student_id: student_id || null,
      phone: phone || null
    });

    const user = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: assignedRole,
      department: null,
      student_id: newUser.student_id,
      phone: newUser.phone
    };

    logAuditEvent({
      userId: newUser._id,
      userEmail: email,
      action: 'REGISTER_STUDENT_SUCCESS',
      ipAddress: req.ip,
      details: { role: assignedRole }
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'Student account registered successfully.',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register account. Please try again.' });
  }
});

// Admin-only endpoint: Dean Sir creates new faculty / staff officer accounts
router.post('/create-staff', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Only Dean / Admin can create faculty staff accounts.' });
    }

    const { name, email, password, department, staff_id, phone, role = 'staff' } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: 'Name, email, password, and department are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'staff',
      department,
      student_id: staff_id || null,
      phone: phone || null
    });

    logAuditEvent({
      userId: req.user.id || req.user._id,
      userEmail: req.user.email,
      action: 'FACULTY_ACCOUNT_CREATED',
      ipAddress: req.ip,
      details: { createdUser: email, department, role }
    });

    res.status(201).json({
      message: `Faculty account for ${name} (${department}) created successfully.`,
      user: {
        id: newStaff._id.toString(),
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        department: newStaff.department
      }
    });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create faculty account.' });
  }
});

// Login (with brute-force lockout protection and validation) (OWASP A07)
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
      // Uniform timing dummy compare to prevent timing attack enumeration
      await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if account is currently locked out
    if (userDoc.lock_until && userDoc.lock_until > new Date()) {
      const remainingMinutes = Math.ceil((userDoc.lock_until.getTime() - Date.now()) / (60 * 1000));
      logAuditEvent({
        userId: userDoc._id,
        userEmail: email,
        action: 'LOGIN_ATTEMPT_LOCKED_ACCOUNT',
        ipAddress: req.ip,
        details: `Rejected login attempt on locked account (${remainingMinutes}m remaining).`
      });
      return res.status(423).json({
        error: `Account is temporarily locked due to repeated failed login attempts. Please wait ${remainingMinutes} minute(s) before trying again.`
      });
    }

    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      const newFailedCount = (userDoc.failed_login_attempts || 0) + 1;
      let updateFields = { failed_login_attempts: newFailedCount };

      if (newFailedCount >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        updateFields.lock_until = lockoutTime;

        logAuditEvent({
          userId: userDoc._id,
          userEmail: email,
          action: 'ACCOUNT_LOCKED_BRUTE_FORCE',
          ipAddress: req.ip,
          details: 'Account locked for 15 minutes after 5 consecutive failed login attempts.'
        });
      } else {
        logAuditEvent({
          userId: userDoc._id,
          userEmail: email,
          action: 'LOGIN_FAILURE_WRONG_PASSWORD',
          ipAddress: req.ip,
          details: `Failed password verification (${newFailedCount}/5 attempts).`
        });
      }

      await User.findByIdAndUpdate(userDoc._id, updateFields);

      if (newFailedCount >= 5) {
        return res.status(423).json({
          error: 'Security alert: Account has been locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }

      return res.status(401).json({
        error: `Invalid email or password. (${5 - newFailedCount} attempt(s) remaining before temporary lockout).`
      });
    }

    // Reset failed login attempts and clear lockout on successful login
    if (userDoc.failed_login_attempts > 0 || userDoc.lock_until) {
      await User.findByIdAndUpdate(userDoc._id, {
        failed_login_attempts: 0,
        lock_until: null
      });
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
