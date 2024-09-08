import { db } from '$lib/server/db/index.js';
import { usersTable } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

// Useless middleware?

export const load = async ({ locals }) => {
	if (!locals.user) {
		return;
	}

	// const fetchedUser = await db
	// 	.select({
	// 		email: usersTable.email,
	// 		verified: usersTable.verified,
	// 		role: usersTable.role
	// 	})
	// 	.from(usersTable)
	// 	.where(eq(usersTable.id, locals.user))
	// 	.then((res) => res[0] ?? null);

	return { user: locals.user };
};
