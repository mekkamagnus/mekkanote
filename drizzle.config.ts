import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.NODE_ENV === 'production' ? './db.sqlite' : './dev.db',
  },
} satisfies Config;