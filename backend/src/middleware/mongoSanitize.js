/**
 * NoSQL Injection Protection Middleware (OWASP A03)
 * Recursively removes any keys containing MongoDB query operators (starting with '$' or containing '.')
 * from req.body, req.query, and req.params.
 */

function sanitizeObject(target) {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key of Object.keys(target)) {
    // Block any key starting with '$' (e.g. $gt, $where, $ne) or containing '.' (prototypal / subfield injection)
    if (key.startsWith('$') || key.includes('.')) {
      console.warn(`[SECURITY ALERT] Stripped suspicious NoSQL operator key: "${key}"`);
      continue;
    }

    const value = target[key];
    sanitized[key] = typeof value === 'object' ? sanitizeObject(value) : value;
  }

  return sanitized;
}

function mongoSanitize(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

module.exports = {
  mongoSanitize,
  sanitizeObject
};
