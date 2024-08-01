import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema.ts',
	dbCredentials: {
		url: 'postgresql://postgres:admin@localhost:5435/postgres'
	},
	out: './drizzle'
});
