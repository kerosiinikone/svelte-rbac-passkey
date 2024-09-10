import type { Cookies } from '@sveltejs/kit';
import type { CookieSerializeOptions } from 'cookie';

export type CookieParameters = {
	name: string;
	val: string;
	opts: CookieSerializeOptions;
};

const DEFAULT_COOKIE_OPTS = { secure: true, httpOnly: true, path: '/' };

export function logout(cookies: Cookies, locals: App.Locals) {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
	locals.user = undefined;
}

export function setCookies(writer: Cookies, cookies: CookieParameters[]): void {
	cookies.map((c) => {
		writer.set(c.name, c.val, {
			...DEFAULT_COOKIE_OPTS,
			...c.opts
		});
	});
}
