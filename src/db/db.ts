
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL is not set');
}

const connectionString = process.env.DIRECT_URL!

console.log(connectionString);
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString)
const db = drizzle(client, { schema });
export default db;






