import { AppError, APP_ERROR_CODES } from '../errors/AppError.js';

/**
 * Validates that a single ID is a non-empty string
 * @param id The ID to validate
 * @param fieldName Optional field name for error message
 * @throws AppError if validation fails
 */
export const validateId = (id: unknown, fieldName: string = 'ID'): string => {
    if (typeof id !== 'string' || !id.trim()) {
        throw new AppError(
            APP_ERROR_CODES.INVALID_INPUT,
            `Invalid ${fieldName}.`,
            400
        );
    }
    return id;
};

/**
 * Validates multiple IDs at once
 * @param ids Object containing IDs to validate
 * @throws AppError if any validation fails
 * @returns The validated IDs object
 */
export const validateIds = (ids: Record<string, unknown>): Record<string, string> => {
    const validated: Record<string, string> = {};

    for (const [key, value] of Object.entries(ids)) {
        validated[key] = validateId(value, key);
    }

    return validated;
};

/**
 * Helper to extract and validate a single ID from req.params
 * @param req Express Request object
 * @param paramName The parameter name in req.params
 * @returns The validated ID
 */
export const extractAndValidateId = (req: any, paramName: string = 'id'): string => {
    const id = req.params[paramName];
    return validateId(id, paramName);
};

/**
 * Helper to extract and validate multiple IDs from req.params
 * @param req Express Request object
 * @param paramNames Array of parameter names to extract
 * @returns Object with validated IDs
 */
export const extractAndValidateIds = (req: any, ...paramNames: string[]): Record<string, string> => {
    const ids: Record<string, unknown> = {};

    for (const paramName of paramNames) {
        ids[paramName] = req.params[paramName];
    }

    return validateIds(ids);
};

