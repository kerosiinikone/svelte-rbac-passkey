import { invalidate, invalidateAll } from '$app/navigation';
import { db } from '$lib/server/db/index.js';
import { usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { getUserById, getUserPasskeys } from '$lib/server/operations';
import { presentPasskeys, presentUser } from '$lib/server/utils/dto.js';
import { Roles } from '$lib/types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(301, '/');

	const fetchedUser = await getUserById(locals.user);
	const userPasskeys = await getUserPasskeys(locals.user);

	return { user: presentUser(fetchedUser!), verifiedPasskeys: presentPasskeys(userPasskeys) };
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
