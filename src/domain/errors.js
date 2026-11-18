// Each error carries a machine-readable code so other code can check
// err.code === "SOLD_OUT" instead of matching on message text, which
// can change.
export const ErrorCodes = Object.freeze({
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  SOLD_OUT: "SOLD_OUT",
  ALREADY_CANCELLED: "ALREADY_CANCELLED",
});

export class DomainError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}