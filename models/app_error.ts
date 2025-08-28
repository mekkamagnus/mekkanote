export interface AppError {
  code: string;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
}

export const AppError = {
  create: (code: string, message: string, originalError?: Error, context?: Record<string, unknown>): AppError => ({
    code,
    message,
    originalError,
    context
  })
};
