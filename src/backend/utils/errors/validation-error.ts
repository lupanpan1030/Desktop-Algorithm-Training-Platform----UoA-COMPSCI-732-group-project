// Align with TSOA validation error format. Use for validation errors documentation.
export interface ValidateError {
  message: "Validation failed";
  details: { [name: string]: unknown };
}