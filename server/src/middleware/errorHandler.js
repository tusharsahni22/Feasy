/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';

/** Central error handler — normalises Mongoose & app errors into JSON. */
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  // Mongoose validation → 400 with a readable message
  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `Duplicate ${field}: "${err.keyValue?.[field]}" already exists`;
  }

  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ message });
}
