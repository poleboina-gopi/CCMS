const rateLimit = require('express-rate-limit');

// Strict rate limiter for Authentication (Login / Register) to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down and try again later.'
  }
});

// Anti-Spam limiter for Complaint Submissions
const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40, // Max 40 complaint creations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Complaint submission limit reached. You can submit up to 40 tickets per hour.'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  complaintLimiter
};
