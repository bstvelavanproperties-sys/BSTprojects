// Mongo/driver messages were being handed straight to the client, which leaks
// schema field names, index names and driver internals to anyone who can provoke
// an error. Log the detail, return a description.
//
// NOTE: unmatched routes and uncaught exceptions are deliberately left to Express's
// own handlers, which is what the API does today — adding JSON handlers for those
// would change the response body of every 404 and 500. Worth doing, but as its own
// change with its own testing, not silently inside a restructure.
export const fail = (response, status, message, error) => {
  if (error) console.error(`[${status}] ${message}:`, error);
  return response.status(status).json({ error: message });
};
