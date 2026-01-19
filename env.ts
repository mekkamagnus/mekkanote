// This is a simple environment variable handler
// In a real application, you might want to use a library like zod for validation
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || './dev.db',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
} as const;