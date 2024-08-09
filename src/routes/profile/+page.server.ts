import { db } from '$lib/server/db/index.js';
import { usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const load = async ({ parent, locals }) => {
	// Process accessToken here ?

	const data = await parent();

	if (!data.user || !locals.user) {
		redirect(303, '/login');
	}

	const userId = data.user || locals.user;

	// Reveal only what is necessary
	// Promise.all()

	const user = await db
		.select({
			email: usersTable.email,
			verified: usersTable.verified,
			role: usersTable.role
		})
		.from(usersTable)
		.where(eq(usersTable.id, userId))
		.then((res) => res[0] ?? null);

	const userPasskeys = await db
		.select()
		.from(webPasskeyTable)
		.where(eq(webPasskeyTable.internalUserId, userId));

	if (!user) {
		return error(400);
	}

	return { user, verifiedPasskeys: userPasskeys };
};

export const actions = {
	deletePasskey: async ({ request }) => {
		// Set max length requirements
		const schema = z.string();

		const formData = await request.formData();
		const pid = formData.get('pid') as string;

		const result = schema.safeParse(pid);

		if (!result.success) {
			fail(400);
		}

		await db.delete(webPasskeyTable).where(eq(webPasskeyTable.credId, pid));

		redirect(303, '/profile');
	}
};
