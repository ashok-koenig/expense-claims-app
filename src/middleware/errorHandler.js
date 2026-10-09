// All errors are returned as { error: { message, details? } }.
// Express identifies error handlers by their four-argument signature, so `next` must stay.
function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error(err);

  let message = err.message;
  if (err.type === 'entity.parse.failed') message = 'Request body is not valid JSON';
  else if (status >= 500) message = 'Internal server error';

  const error = { message };
  if (err.details) error.details = err.details;
  res.status(status).json({ error });
}

module.exports = errorHandler;
