import { JWT_SECRET } from '$env/static/private';
import { getUserById } from '$lib/server/operations/users.operations';
import { logout, setCookies, signTokenPayload } from '$lib/server/utils/auth';
import type { CookieParameters, TokenResponse } from '$lib/types';
import { type Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

// TODO: Move to the entity lib

type User = {
	id: string;
};

const protectedRoutes = ['/', '/profile'];

export async function handle({ event, resolve }) {
	const accessToken = event.cookies.get('accessToken');

	if (protectedRouteMatcher(event.url.pathname, protectedRoutes)) {
		const user: User | null = await verifyAndFetchUser(accessToken ?? '', event.cookies);
		if (!user) {
			logout(event.cookies, event.locals);
		} else {
			event.locals.user = user?.id;
		}
	}

	const response = await resolve(event);
	return response;
}

const protectedRouteMatcher = (path: string, routes: string[]): boolean =>
	routes.some((r) => path.startsWith(r));

async function getTokens(refreshToken: string): Promise<TokenResponse | null> {
	let verifiedRefreshPayload;

	try {
		verifiedRefreshPayload = jwt.verify(refreshToken, JWT_SECRET) as {
			id: string;
			version: number;
			exp: number;
		};
	} catch (e) {
		return null;
	}

	// Update token version??
	const user = await getUserById(verifiedRefreshPayload.id);

	if (!user) {
		return null;
	}

	if (verifiedRefreshPayload.version !== user.token_version) {
		return null;
	}

	// Sign new tokens
	const { accessToken, refreshToken: newRefreshToken } = signTokenPayload(
		user.id,
		user.token_version
	);

	return {
		accessToken,
		refreshToken: newRefreshToken
	};
}

async function refresh(cookies: Cookies): Promise<User | null> {
	const initialRefreshToken = cookies.get('refreshToken');

	if (!initialRefreshToken) return null;

	const tokenSet = await getTokens(initialRefreshToken);

	if (!tokenSet) return null;

	const { accessToken, refreshToken } = tokenSet;

	try {
		const loggedInUser = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};

		if (!loggedInUser.id) {
			return null;
		}

		// Circular dependencies ?
		const cookieList: CookieParameters[] = [
			{ name: 'accessToken', val: accessToken, opts: { maxAge: 7 * 24 * 60 * 60 * 1000 } },
			{ name: 'refreshToken', val: refreshToken, opts: { maxAge: 15 * 60 * 1000 } }
		];

		setCookies(cookies, cookieList);

		return { id: loggedInUser.id };
	} catch (e) {
		return null;
	}
}

async function verifyAndFetchUser(accessToken: string, cookies: Cookies): Promise<User | null> {
	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};
	} catch (e) {
		return await refresh(cookies);
	}

	const fetchedUser = await getUserById(verifiedAccessPayload.id);

	if (!fetchedUser) return null;

	return { id: fetchedUser.id };
}
