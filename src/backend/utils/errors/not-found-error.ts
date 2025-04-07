// Thrown when a resource isn't found; custom error for missing 404 support in TSOA.
export class NotFoundError extends Error {
  public statusCode: number;
  constructor(message: string = "Not Found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}