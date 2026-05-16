/**
 * Global error handler middleware for Express
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]:', err.stack || err.message || err);

  const statusCode = err.status || 500;
  const message = err.message || 'Erro interno no servidor';

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
