import OpenAI from 'openai';
import { env } from '@/env';

// Initialize DeepSeek client (OpenAI-compatible API)
let deepseek: OpenAI;

if (!env.DEEPSEEK_API_KEY) {
  console.warn('DEEPSEEK_API_KEY is not set. AI features will not work.');
  // We'll still initialize with a dummy key to avoid runtime errors in development
  deepseek = new OpenAI({
    apiKey: 'sk-dummy-key-for-dev',
    baseURL: 'https://api.deepseek.com'
  });
} else {
  deepseek = new OpenAI({
    apiKey: env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com'
  });
}

export { deepseek };