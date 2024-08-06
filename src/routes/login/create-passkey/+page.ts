import { redirect } from '@sveltejs/kit';

export const load = async ({ parent }) => {
	const data = await parent();
	if (!data.user) {
		redirect(301, '/');
	}
};
