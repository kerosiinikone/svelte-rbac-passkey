import { DatabaseError } from '$lib/errors.js';
import {
	deletePasskey,
	getUserById,
	getUserPasskeys,
	updateUserRole
} from '$lib/server/operations';
import { presentPasskeys, presentUser } from '$lib/server/utils/dto.js';
import { Roles } from '$lib/types.js';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';

export const load = async ({ locals }) => {
	if (!locals.user) redirect(301, '/');

	try {
		const fetchedUser = await getUserById(locals.user);
		const userPasskeys = await getUserPasskeys(locals.user);

		return { user: presentUser(fetchedUser!), verifiedPasskeys: presentPasskeys(userPasskeys) };
	} catch (err) {
		if (err instanceof DatabaseError) {
			return { error: err.message };
		}
		error(500);
	}
};

export const actions = {
	deletePasskey: async ({ request, locals }) => {
		const schema = z.string();

		const formData = Object.fromEntries(await request.formData());

		const pid = formData.pid as string;

		const result = schema.safeParse(pid);

		if (!result.success) {
			return {
				error: result.error
			};
		}

		if (!locals.user) {
			return {
				error: 'No auth'
			};
		}

		try {
			await deletePasskey(pid);
			redirect(303, '/profile');
		} catch (err) {
			if (err instanceof DatabaseError) {
				return { error: err.message };
			}
			error(500);
		}
	},
	switchRole: async ({ request, locals }) => {
		const schema = z.nativeEnum(Roles);

		const formData = Object.fromEntries(await request.formData());
		const role = formData.role as string;

		const result = schema.safeParse(role);

		if (!result.success) {
			return {
				error: result.error
			};
		}

		if (!locals.user) {
			return {
				error: 'No auth'
			};
		}

		try {
			await updateUserRole(role as Roles, locals.user);
		} catch (err) {
			if (err instanceof DatabaseError) {
				return { error: err.message };
			}
			error(500);
		}
	}
};
