import { redirect } from '@sveltejs/kit';

export const load = async ({ cookies, locals }) => {
	locals.user = undefined;
	cookies.delete('refreshToken', { path: '/' });
	cookies.delete('accessToken', { path: '/' });

	redirect(303, '/');
};
