import {
	deletePasskey,
	getUserById,
	getUserPasskeys,
	updateUserRole
} from '$lib/server/operations';
import { presentPasskeys, presentUser } from '$lib/server/utils/dto.js';
import { Roles } from '$lib/types.js';
import { error, fail, redirect } from '@sveltejs/kit';
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

		await deletePasskey(pid);

		redirect(303, '/profile');
	},
	switchRole: async ({ request, locals }) => {
		const schema = z.nativeEnum(Roles);

		const loggedInUser = locals.user;
		if (!loggedInUser) {
			return;
		}

		const formData = Object.fromEntries(await request.formData());
		const role = formData.role as string;

		const result = schema.safeParse(role);

		if (!result.success) {
			error(400);
		}

		await updateUserRole(role as Roles, loggedInUser);
	}
};
