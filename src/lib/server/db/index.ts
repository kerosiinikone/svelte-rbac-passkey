import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';

// Keep these files in the $lib/server since they should never reach the client

// Migrations

const client = postgres(DATABASE_URL);

export const db = drizzle(client);
