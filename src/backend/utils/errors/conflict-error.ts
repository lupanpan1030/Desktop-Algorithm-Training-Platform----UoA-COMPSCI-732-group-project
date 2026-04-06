export class ConflictError extends Error {
  public statusCode = 409;

  constructor(message: string = "Conflict") {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
