
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL!,
  },
});
