import { AuthenticationError, DatabaseError } from '$lib/errors.js';
import { getUserRole, getItemsByRole } from '$lib/server/operations';
import { presentItems } from '$lib/server/utils/dto.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return { items: null };
	}

	try {
		const role = await getUserRole(user);
		const items = await getItemsByRole(role);

		return presentItems(items);
	} catch (err) {
		if (err instanceof DatabaseError) {
			return { error: err.message };
		}
		error(500);
	}
};
