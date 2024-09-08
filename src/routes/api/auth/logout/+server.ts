import { redirect } from '@sveltejs/kit';

export const GET = async ({ cookies, locals }) => {
	cookies.delete('refreshToken', { path: '/' });
	cookies.delete('accessToken', { path: '/' });
	locals.user = undefined;

	redirect(303, '/');
};
