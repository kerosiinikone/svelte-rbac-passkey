import { JWT_SECRET } from '$env/static/private';
import type { CookieParameters, TokenResponse } from '$lib/types';
import type { Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

type TokenPayload = {
	exp: number;
}

const DEFAULT_COOKIE_OPTS = {
	secure: true,
	httpOnly: true,
	path: '/',
	sameSite: 'lax' as boolean | 'lax' | 'strict' | 'none' | undefined
};


export const verifyJWT = <T extends TokenPayload>(token: string): T => {
	try {
		return jwt.verify(token, JWT_SECRET) as T;
	} catch (error) {
		throw new Error('Your token has expired.');
	}
};


export function setCookies(writer: Cookies, cookies: CookieParameters[]): void {
	cookies.map((c) => {
		writer.set(c.name, c.val, {
			...DEFAULT_COOKIE_OPTS,
			...c.opts
		});
	});
}

export function signTokenPayload(id: string, version: number): TokenResponse {
	return {
		accessToken: jwt.sign(
			{
				id
			},
			JWT_SECRET
		),
		refreshToken: jwt.sign(
			{
				id,
				version
			},
			JWT_SECRET
		)
	};
}

export function logout(cookies: Cookies, locals?: App.Locals): void {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
	if (locals?.user) locals.user = undefined;
}

export function createPasscode(): string {
	const array = new Uint32Array(6);
	crypto.getRandomValues(array);
	return array.map((i) => parseFloat(JSON.stringify(i)[0])).join('');
}
