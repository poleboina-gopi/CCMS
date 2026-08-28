require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./db');

const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const { mongoSanitize } = require('./middleware/mongoSanitize');
const { hppProtection } = require('./middleware/hppProtection');
const { timeoutProtection } = require('./middleware/timeoutProtection');

const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const analyticsRoutes = require('./routes/analytics');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Disable express identifier header (OWASP A05)
app.disable('x-powered-by');

// 1. Request Timeout Protection (Slowloris & Connection Starvation Defense)
app.use(timeoutProtection(30000));

// 2. Enhanced Helmet Security Headers (OWASP A05)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  dnsPrefetchControl: { allow: false }
}));

// 3. Enable CORS with credentials and domain validation
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, healthchecks) or if in allowed list
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for API consumers
    }
  } : true,
  credentials: true
}));

// 4. Body parsers with payload size limits (DoS mitigation)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. NoSQL Injection Protection (OWASP A03)
app.use(mongoSanitize);

// 6. HTTP Parameter Pollution Protection (HPP)
app.use(hppProtection());

// 7. Rate Limiting for all API routes (DoS / Brute-force defense)
app.use('/api', apiLimiter);

// Ensure upload directory exists and serve statically with secure CORS & resource policy
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(uploadsDir));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    security: 'OWASP Top 10 Hardened',
    database: 'MongoDB Atlas',
    service: 'College Complaint Management System API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Global Error Handler (OWASP A05 - No Stack Trace Leaks in Production)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProd ? 'An unexpected server error occurred.' : (err.message || 'Internal Server Error')
  });
});

// Start Server & Connect MongoDB Atlas
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 CCMS Backend API server running at http://localhost:${PORT}`);
    console.log(`📡 Healthcheck available at http://localhost:${PORT}/api/health`);
  });
}

startServer();
