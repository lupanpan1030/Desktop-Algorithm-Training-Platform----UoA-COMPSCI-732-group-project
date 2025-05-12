

/**
 * ForbiddenError — represents an HTTP 403 error.
 *
 * Throw this when the client tries to perform an action that is not allowed,
 * e.g., deleting the default programming language.
 */
export class ForbiddenError extends Error {
  /** HTTP status code to be picked up by the global error handler */
  public statusCode = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    // Restore prototype chain for instanceof checks after transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}