import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper for asynchronous functions to capture errors
 * and automatically pass them to the errorHandler middleware via next().
 *
 * @param fn The asynchronous service/controller function
 * @returns A standard Express middleware function
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};