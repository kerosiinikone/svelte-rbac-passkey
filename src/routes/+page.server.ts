import { getUserRole, getItemsByRole } from '$lib/server/operations';
import { presentItems } from '$lib/server/utils/dto.js';

export const load = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return { items: null };
	}

	const role = await getUserRole(user);
	const items = await getItemsByRole(role);

	return presentItems(items);
};
