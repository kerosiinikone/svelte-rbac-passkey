import { DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Keep these files in the $lib/server since they should never reach the client

const client = postgres(DATABASE_URL);

const db = drizzle(client);

export default db;
