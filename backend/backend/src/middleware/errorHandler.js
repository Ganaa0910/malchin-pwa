/**
 * Central error-handling middleware.
 * Must be registered last in Express.
 */
function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);

  // Axios / Traccar errors
  if (err.response) {
    return res.status(err.response.status).json({
      error: "Traccar API error",
      detail: err.response.data,
    });
  }

  // PostgreSQL errors
  if (err.code && err.code.startsWith("2") || err.code?.startsWith("4")) {
    return res.status(500).json({ error: "Database error", detail: err.message });
  }

  res.status(err.status ?? 500).json({ error: err.message ?? "Internal server error" });
}

module.exports = errorHandler;
