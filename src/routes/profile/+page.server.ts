import { db } from '$lib/server/db/index.js';
import { usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { Roles } from '$lib/types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const load = async ({ locals }) => {
	if (!locals.user) {
		redirect(301, '/');
	}

	const fetchedUser = await db
		.select({
			email: usersTable.email,
			verified: usersTable.verified,
			role: usersTable.role
		})
		.from(usersTable)
		.where(eq(usersTable.id, locals.user))
		.then((res) => res[0] ?? null);

	const userPasskeys = await db
		.select()
		.from(webPasskeyTable)
		.where(eq(webPasskeyTable.internalUserId, locals.user));

	return { user: fetchedUser, verifiedPasskeys: userPasskeys };
};

export const actions = {
	deletePasskey: async ({ request }) => {
		const schema = z.string();

		const formData = Object.fromEntries(await request.formData());
		const pid = formData.pid as string;

		const result = schema.safeParse(pid);

		if (!result.success) {
			fail(400);
		}

		await db.delete(webPasskeyTable).where(eq(webPasskeyTable.credId, pid));

		redirect(303, '/profile');
	},
	switchRole: async ({ request, locals }) => {
		const schema = z.nativeEnum(Roles);

		const loggedInUser = locals.user;
		if (!loggedInUser) {
			return;
		}

		const formData = await request.formData();
		const role = formData.get('role') as string;

		const result = schema.safeParse(role);

		if (!result.success) {
			error(400);
		}

		await db
			.update(usersTable)
			.set({
				role: role as Roles
			})
			.where(eq(usersTable.id, loggedInUser));
	}
};
