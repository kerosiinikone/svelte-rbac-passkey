export const load = async ({ cookies, locals }) => {
	locals.user = undefined;
	cookies.delete('refreshToken', { path: '/' });
	cookies.delete('accessToken', { path: '/' });

	// Redirect to home?
};
