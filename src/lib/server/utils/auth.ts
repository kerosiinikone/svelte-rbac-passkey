import { JWT_SECRET } from '$env/static/private';
import type { CookieParameters, TokenResponse } from '$lib/types';
import type { Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const DEFAULT_COOKIE_OPTS = { secure: true, httpOnly: true, path: '/' };

export function setCookies(writer: Cookies, cookies: CookieParameters[]): void {
	cookies.map((c) => {
		writer.set(c.name, c.val, {
			...DEFAULT_COOKIE_OPTS,
			...c.opts
		});
	});
}

export function signTokenPayload(id: string, version: number): TokenResponse {
	const accessToken = jwt.sign(
		{
			id
		},
		JWT_SECRET
	);
	const refreshToken = jwt.sign(
		{
			id,
			version
		},
		JWT_SECRET
	);

	return {
		accessToken,
		refreshToken
	};
}

export function logout(cookies: Cookies, locals: App.Locals) {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
	locals.user = undefined;
}

export function createPasscode() {
	const array = new Uint32Array(6);
	crypto.getRandomValues(array);
	return array.map((i) => parseFloat(JSON.stringify(i)[0])).join('');
}
