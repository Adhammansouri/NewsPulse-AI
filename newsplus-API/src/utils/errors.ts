export class AppError extends Error {
  readonly statusCode: number;
  readonly publicMessage: string;

  constructor(statusCode: number, publicMessage: string, internalMessage = publicMessage) {
    super(internalMessage);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "invalid-credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class ValidationError extends AppError {
  constructor(publicMessage = "invalid-request") {
    super(400, publicMessage);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super(401, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class TooManyRequestsError extends AppError {
  constructor() {
    super(429, "too-many-requests");
    this.name = "TooManyRequestsError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(publicMessage = "service-unavailable") {
    super(503, publicMessage);
    this.name = "ServiceUnavailableError";
  }
}