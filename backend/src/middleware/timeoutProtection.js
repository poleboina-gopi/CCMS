/**
 * Request Timeout Protection Middleware (DoS / Slowloris Defense)
 * Terminates requests that hang or take longer than the defined threshold (default 30 seconds),
 * preventing connection pool starvation and slow HTTP attacks.
 */

function timeoutProtection(timeoutMs = 30000) {
  return (req, res, next) => {
    // Set response socket timeout
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout. The server closed the connection because the request took too long.'
        });
      }
    });

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Gateway Timeout. Server processing exceeded maximum allowable execution window.'
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

module.exports = {
  timeoutProtection
};
