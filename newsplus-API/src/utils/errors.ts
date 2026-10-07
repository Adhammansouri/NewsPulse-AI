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

export class NotFoundError extends AppError {
  constructor(publicMessage = "not-found") {
    super(404, publicMessage);
    this.name = "NotFoundError";
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

export class OpenAIQuotaError extends AppError {
  constructor() {
    super(402, "openai-quota");
    this.name = "OpenAIQuotaError";
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(publicMessage = "service-unavailable") {
    super(503, publicMessage);
    this.name = "ServiceUnavailableError";
  }
}

export class OpenAINotConfiguredError extends AppError {
  constructor() {
    super(503, "openai-not-configured");
    this.name = "OpenAINotConfiguredError";
  }
}

export class OpenAIUpstreamError extends AppError {
  constructor(publicMessage = "openai-upstream") {
    super(502, publicMessage);
    this.name = "OpenAIUpstreamError";
  }
}