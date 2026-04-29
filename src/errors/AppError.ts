/**
 * Codes d'erreur applicatifs standardisés
 */
export const APP_ERROR_CODES = {
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Auth & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business Logic
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
} as const;

export type AppErrorCode = typeof APP_ERROR_CODES[keyof typeof APP_ERROR_CODES];

/**
 * Application Error
 * To be thrown by services/controllers
 * Caught by global error handler middleware
 */
export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Factory methods for common errors
 */
export const AppErrors = {
  notFound: (resource: string, id?: string) =>
    new AppError(
      APP_ERROR_CODES.RESOURCE_NOT_FOUND,
      `${resource} not found${id ? ` (id: ${id})` : ''}`,
      404
    ),

  alreadyExists: (resource: string, field?: string) =>
    new AppError(
      APP_ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      `${resource} already exists${field ? ` (${field})` : ''}`,
      409
    ),

  invalidInput: (message: string, details?: Record<string, any>) =>
    new AppError(
      APP_ERROR_CODES.INVALID_INPUT,
      message,
      400,
      details
    ),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(
      APP_ERROR_CODES.UNAUTHORIZED,
      message,
      401
    ),

  forbidden: (message = 'Access forbidden') =>
    new AppError(
      APP_ERROR_CODES.FORBIDDEN,
      message,
      403
    ),

  businessLogicError: (message: string) =>
    new AppError(
      APP_ERROR_CODES.BUSINESS_LOGIC_ERROR,
      message,
      422
    ),

  internalError: (message = 'Internal server error') =>
    new AppError(
      APP_ERROR_CODES.INTERNAL_SERVER_ERROR,
      message,
      500
    ),

  databaseError: (originalError: any) =>
    new AppError(
      APP_ERROR_CODES.DATABASE_ERROR,
      `Database error: ${originalError?.message || 'Unknown'}`,
      500,
      { originalCode: originalError?.code }
    ),
};

