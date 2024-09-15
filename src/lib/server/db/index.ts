import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// Keep these files in the $lib/server since they should never reach the client

const client = postgres(DATABASE_URL);

const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });

export default db;
