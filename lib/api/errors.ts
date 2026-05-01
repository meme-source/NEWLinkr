// Domain error hierarchy. Throw these from services; route handlers catch them
// via `withRoute` and turn them into matching HTTP responses.
//
// Convention: every error type carries a stable `code` (machine-readable) and
// HTTP `status`. Add new subclasses rather than reusing AppError directly.

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options: { code: string; status: number; cause?: unknown }) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = options.code;
    this.status = options.status;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { code: "BAD_REQUEST", status: 400, cause: options?.cause });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", options?: { cause?: unknown }) {
    super(message, { code: "UNAUTHORIZED", status: 401, cause: options?.cause });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", options?: { cause?: unknown }) {
    super(message, { code: "FORBIDDEN", status: 403, cause: options?.cause });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", options?: { cause?: unknown }) {
    super(message, { code: "NOT_FOUND", status: 404, cause: options?.cause });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { code: "CONFLICT", status: 409, cause: options?.cause });
  }
}

// Thrown by services when an upstream dependency (DB, provider API, AI) fails.
// The error message MUST NOT include sensitive payload — sanitize before throwing.
export class UpstreamError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, { code: "UPSTREAM", status: 502, cause: options?.cause });
  }
}
