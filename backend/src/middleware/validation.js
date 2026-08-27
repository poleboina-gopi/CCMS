const validator = require('validator');
const { logAuditEvent } = require('./auditLogger');

const VALID_CATEGORIES = [
  'Wi-Fi & IT',
  'Hostel Affairs',
  'Maintenance & Infrastructure',
  'Infrastructure',
  'Electrical & Plumbing',
  'Academics',
  'Canteen & Mess',
  'Transport',
  'Library',
  'Other'
];

const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const VALID_ROLES = ['student', 'admin', 'staff'];
const VALID_STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

/**
 * Validation for user registration
 */
function validateRegister(req, res, next) {
  let { name, email, password, role = 'student', student_id, phone, department } = req.body;

  if (!name || typeof name !== 'string' || validator.isEmpty(name.trim())) {
    return res.status(400).json({ error: 'Valid full name is required (2-80 characters).' });
  }
  name = name.trim();
  if (!validator.isLength(name, { min: 2, max: 80 })) {
    return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
  }

  if (!email || typeof email !== 'string' || !validator.isEmail(email.trim())) {
    logAuditEvent({
      userEmail: typeof email === 'string' ? email : 'invalid',
      action: 'SUSPICIOUS_REGISTRATION_INPUT',
      ipAddress: req.ip,
      details: 'Rejected registration attempt due to invalid email structure.'
    });
    return res.status(400).json({ error: 'A valid email address is required (e.g. user@campus.edu).' });
  }

  if (!password || typeof password !== 'string' || !validator.isLength(password, { min: 6, max: 128 })) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role specified. Allowed: ${VALID_ROLES.join(', ')}` });
  }

  // Sanitized body
  req.body.name = validator.escape(name);
  req.body.email = validator.normalizeEmail(email.trim().toLowerCase());
  req.body.role = role;
  req.body.student_id = student_id ? validator.escape(student_id.toString().trim()) : null;
  req.body.phone = phone ? validator.escape(phone.toString().trim()) : null;
  req.body.department = department ? validator.escape(department.toString().trim()) : null;

  next();
}

/**
 * Validation for login
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !validator.isEmail(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!password || typeof password !== 'string' || validator.isEmpty(password)) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validation for Complaint Submission
 */
function validateComplaintInput(req, res, next) {
  let { title, description, category, location, building, room, priority = 'Medium' } = req.body;

  if (!title || typeof title !== 'string' || !validator.isLength(title.trim(), { min: 3, max: 200 })) {
    return res.status(400).json({ error: 'Complaint title is required (between 3 and 200 characters).' });
  }

  if (!description || typeof description !== 'string' || !validator.isLength(description.trim(), { min: 5, max: 5000 })) {
    return res.status(400).json({ error: 'Detailed description is required (at least 5 characters).' });
  }

  if (!category || typeof category !== 'string' || !VALID_CATEGORIES.includes(category.trim())) {
    return res.status(400).json({ error: `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}` });
  }

  if (!location || typeof location !== 'string' || !validator.isLength(location.trim(), { min: 3, max: 300 })) {
    return res.status(400).json({ error: 'Location details are required (building, floor, room).' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority.trim())) {
    req.body.priority = 'Medium';
  } else {
    req.body.priority = priority.trim();
  }

  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.category = category.trim();
  req.body.location = location.trim();
  req.body.building = building ? building.trim() : null;
  req.body.room = room ? room.trim() : null;

  next();
}

/**
 * Validation for comment submission
 */
function validateCommentInput(req, res, next) {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !validator.isLength(message.trim(), { min: 1, max: 2500 })) {
    return res.status(400).json({ error: 'Comment message cannot be empty or exceed 2500 characters.' });
  }
  req.body.message = message.trim();
  next();
}

/**
 * Validation for Feedback Submission
 */
function validateFeedbackInput(req, res, next) {
  const { rating, comments } = req.body;
  const numRating = Number(rating);

  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Feedback rating must be an integer between 1 and 5.' });
  }

  if (comments && typeof comments === 'string' && comments.length > 1000) {
    req.body.comments = comments.slice(0, 1000).trim();
  }

  req.body.rating = numRating;
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateComplaintInput,
  validateCommentInput,
  validateFeedbackInput,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_CATEGORIES
};
