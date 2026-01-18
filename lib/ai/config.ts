import OpenAI from 'openai';
import { env } from '@/env';

// Initialize OpenAI client
let openai: OpenAI;

if (!env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI features will not work.');
  // We'll still initialize with a dummy key to avoid runtime errors in development
  openai = new OpenAI({ apiKey: 'sk-dummy-key-for-dev' });
} else {
  openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export { openai };