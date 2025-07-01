import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use a fallback connection string for development/testing
const connectionString = process.env.DIRECT_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

console.log('Using database connection:', connectionString.split('@')[1]); // Log only the host part for security
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString)
const db = drizzle(client, { schema });
export default db;






