/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 * Prevents attackers from sending duplicate query parameters to cause unexpected array handling,
 * bypass validation filters, or trigger unhandled server exceptions.
 */

function hppProtection(whitelist = []) {
  return (req, res, next) => {
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
          // Keep only the last parameter value if not explicitly whitelisted as an array
          req.query[key] = req.query[key][req.query[key].length - 1];
        }
      }
    }
    next();
  };
}

module.exports = {
  hppProtection
};
