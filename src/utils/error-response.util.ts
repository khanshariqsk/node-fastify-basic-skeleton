export class HttpError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class UnauthenticatedError extends HttpError {
  constructor(message = "Unauthenticated") {
    super(message, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}
