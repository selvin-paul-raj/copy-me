/**
 * Error handling utilities for Copy-ME
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: string;
  context?: Record<string, any>;
}

export enum ErrorCodes {
  // Room errors
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_EXPIRED = 'ROOM_EXPIRED',
  ROOM_CREATION_FAILED = 'ROOM_CREATION_FAILED',
  
  // User errors
  INVALID_USERNAME = 'INVALID_USERNAME',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Notebook errors
  NOTEBOOK_NOT_FOUND = 'NOTEBOOK_NOT_FOUND',
  NOTEBOOK_NAME_EXISTS = 'NOTEBOOK_NAME_EXISTS',
  CANNOT_DELETE_LAST_NOTEBOOK = 'CANNOT_DELETE_LAST_NOTEBOOK',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

/**
 * Create a standardized error object
 */
export function createError(
  message: string,
  code?: ErrorCodes,
  statusCode?: number,
  context?: Record<string, any>
): AppError {
  return {
    message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
    context
  };
}

/**
 * Error messages for user-friendly display
 */
export const ERROR_MESSAGES: Record<ErrorCodes, string> = {
  [ErrorCodes.ROOM_NOT_FOUND]: 'Room not found. Please check the Room ID and try again.',
  [ErrorCodes.ROOM_EXPIRED]: 'This room has expired. Please create a new room.',
  [ErrorCodes.ROOM_CREATION_FAILED]: 'Failed to create room. Please try again.',
  
  [ErrorCodes.INVALID_USERNAME]: 'Username must be between 2 and 20 characters.',
  [ErrorCodes.USER_NOT_FOUND]: 'User not found in this room.',
  
  [ErrorCodes.NOTEBOOK_NOT_FOUND]: 'Notebook not found.',
  [ErrorCodes.NOTEBOOK_NAME_EXISTS]: 'A notebook with this name already exists.',
  [ErrorCodes.CANNOT_DELETE_LAST_NOTEBOOK]: 'Cannot delete the last notebook in a room.',
  
  [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCodes.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  
  [ErrorCodes.DATABASE_ERROR]: 'Database error occurred. Please try again.',
  [ErrorCodes.SUPABASE_ERROR]: 'Database connection error. Please try again.',
  
  [ErrorCodes.VALIDATION_ERROR]: 'Invalid input provided.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
  
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred.',
  [ErrorCodes.SERVER_ERROR]: 'Server error occurred. Please try again.'
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: AppError | Error | string): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if ('code' in error && error.code && ERROR_MESSAGES[error.code as ErrorCodes]) {
    return ERROR_MESSAGES[error.code as ErrorCodes];
  }
  
  if ('message' in error) {
    return error.message;
  }
  
  return ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Handle API errors and convert to AppError
 */
export function handleApiError(error: any, context?: Record<string, any>): AppError {
  console.error('API Error:', error, context);
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return createError(
      ERROR_MESSAGES[ErrorCodes.NETWORK_ERROR],
      ErrorCodes.NETWORK_ERROR,
      0,
      context
    );
  }
  
  // HTTP errors
  if (error.status) {
    switch (error.status) {
      case 404:
        return createError(
          ERROR_MESSAGES[ErrorCodes.ROOM_NOT_FOUND],
          ErrorCodes.ROOM_NOT_FOUND,
          404,
          context
        );
      case 429:
        return createError(
          ERROR_MESSAGES[ErrorCodes.RATE_LIMIT_EXCEEDED],
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          429,
          context
        );
      case 500:
        return createError(
          ERROR_MESSAGES[ErrorCodes.SERVER_ERROR],
          ErrorCodes.SERVER_ERROR,
          500,
          context
        );
      default:
        return createError(
          error.message || ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR],
          ErrorCodes.UNKNOWN_ERROR,
          error.status,
          context
        );
    }
  }
  
  // Supabase errors
  if (error.code?.startsWith('PGRST')) {
    return createError(
      ERROR_MESSAGES[ErrorCodes.SUPABASE_ERROR],
      ErrorCodes.SUPABASE_ERROR,
      500,
      { ...context, supabaseCode: error.code }
    );
  }
  
  // Generic error
  return createError(
    error.message || ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR],
    ErrorCodes.UNKNOWN_ERROR,
    500,
    context
  );
}

/**
 * Validation utilities
 */
export const validators = {
  username: (username: string): AppError | null => {
    if (!username || username.trim().length < 2 || username.trim().length > 20) {
      return createError(
        ERROR_MESSAGES[ErrorCodes.INVALID_USERNAME],
        ErrorCodes.INVALID_USERNAME,
        400
      );
    }
    return null;
  },
  
  roomId: (roomId: string): AppError | null => {
    if (!roomId || roomId.trim().length === 0) {
      return createError(
        'Room ID is required',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
    return null;
  },
  
  notebookName: (name: string): AppError | null => {
    if (!name || name.trim().length === 0) {
      return createError(
        'Notebook name is required',
        ErrorCodes.MISSING_REQUIRED_FIELD,
        400
      );
    }
    if (name.trim().length > 50) {
      return createError(
        'Notebook name must be 50 characters or less',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
    return null;
  }
};

/**
 * Retry utility with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Don't retry on certain error types
      if (error.status === 404 || error.status === 400) {
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw handleApiError(lastError);
}

/**
 * Timeout utility
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(createError(
        ERROR_MESSAGES[ErrorCodes.TIMEOUT_ERROR],
        ErrorCodes.TIMEOUT_ERROR,
        408
      )), timeoutMs)
    )
  ]);
}
