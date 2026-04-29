import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client.js';
import { AppError, APP_ERROR_CODES } from '../errors/AppError.js';
import { createLogger } from '../lib/logger.js';
const logger = createLogger('ErrorHandler');
// Extend Express Request to include custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
/**
 * Global error handling middleware
 * Must be LAST middleware in app.use() chain
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error with context
  const requestId = req.id || 'unknown';
  const method = req.method;
  const path = req.path;
  let statusCode: number;
  let response: any;
  // ZOD VALIDATION ERRORS
  if (err instanceof ZodError) {
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: APP_ERROR_CODES.INVALID_INPUT,
        message: 'Validation failed',
        details: err.issues.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      },
    };
    logger.warn(`${method} ${path} - Validation error`, {
      requestId,
      errors: response.error.details,
    });
  }
  // APP ERRORS (Custom)
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response = err.toJSON();
    logger.warn(`${method} ${path} - ${err.code}`, {
      requestId,
      statusCode,
      message: err.message,
    });
  }
  // PRISMA ERRORS
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode: code, response: prismaResponse } = handlePrismaError(err);
    statusCode = code;
    response = prismaResponse;
    logger.warn(`${method} ${path} - Prisma error [${err.code}]`, {
      requestId,
      statusCode,
      code: err.code,
    });
  }
  // PRISMA INITIALIZATION ERROR
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    response = {
      success: false,
      error: {
        code: APP_ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'Database connection failed',
      },
    };
    logger.error(`${method} ${path} - Database connection error`, {
      requestId,
      error: err.message,
    });
  }

  else {
    statusCode = err.status || err.statusCode || 500;
    response = {
      success: false,
      error: {
        code: APP_ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: err.message || 'An unexpected error occurred',
      },
    };
    logger.error(`${method} ${path} - Unhandled error`, {
      requestId,
      statusCode,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
  // Send response
  res.status(statusCode).json(response);
}
/**
 * Map Prisma error codes to HTTP status codes and messages
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  response: Record<string, any>;
} {
  const code = err.code;
  switch (code) {
    // Record to find/show not found
    case 'P2025':
      return {
        statusCode: 404,
        response: {
          success: false,
          error: {
            code: APP_ERROR_CODES.RESOURCE_NOT_FOUND,
            message: 'Record not found',
            details: err.meta,
          },
        },
      };
    // Unique constraint violation
    case 'P2002':
      const fields = (err.meta?.target as string[] | undefined)?.join(', ') || 'unknown field';
      return {
        statusCode: 409,
        response: {
          success: false,
          error: {
            code: APP_ERROR_CODES.RESOURCE_ALREADY_EXISTS,
            message: `Unique constraint violation on: ${fields}`,
            details: err.meta,
          },
        },
      };
    // Foreign key constraint failure
    case 'P2003':
      return {
        statusCode: 400,
        response: {
          success: false,
          error: {
            code: APP_ERROR_CODES.CONSTRAINT_VIOLATION,
            message: 'Foreign key constraint failed',
            details: err.meta,
          },
        },
      };
    // Required relation violation
    case 'P2011':
      return {
        statusCode: 400,
        response: {
          success: false,
          error: {
            code: APP_ERROR_CODES.INVALID_INPUT,
            message: 'Required relation violation',
            details: err.meta,
          },
        },
      };
    // Unknown error
    default:
      return {
        statusCode: 500,
        response: {
          success: false,
          error: {
            code: APP_ERROR_CODES.DATABASE_ERROR,
            message: `Database error [${code}]: ${err.message}`,
            details: err.meta,
          },
        },
      };
  }
}
