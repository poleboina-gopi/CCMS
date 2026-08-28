const rateLimit = require('express-rate-limit');

// Strict rate limiter for Authentication (Login / Register) to prevent brute-force (OWASP A07)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// General API rate limiter (DoS mitigation)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Too many requests from this IP. Please slow down and try again later.'
  }
});

// Anti-Spam limiter for Complaint Submissions
const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // Max 25 complaint creations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Complaint submission limit reached. Maximum 25 tickets per hour allowed.'
  }
});

// Anti-Spam limiter for Comments / Discussion
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // Max 60 comments per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Comment posting rate limit reached. Please wait before posting additional updates.'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  complaintLimiter,
  commentLimiter
};

