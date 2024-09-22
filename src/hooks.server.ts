import { JWT_SECRET } from '$env/static/private';
import { getUserById } from '$lib/server/operations/users.operations';
import { logout, setCookies, signTokenPayload } from '$lib/server/utils/auth';
import type { CookieParameters, TokenResponse } from '$lib/types';
import { type Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

type AuthUser = {
	id: string;
};

// Routes that require authentication
const protectedRoutes = ['/', '/profile'];

// Main hook that runs on server requests
export async function handle({ event, resolve }) {
	const accessToken = event.cookies.get('accessToken');

	if (protectedRouteMatcher(event.url.pathname, protectedRoutes)) {
		try {
			const user: AuthUser | null = await verifyAndFetchUser(accessToken ?? '', event.cookies);
			if (!user) {
				logout(event.cookies, event.locals);
			} else {
				event.locals.user = user?.id;
			}
		} catch (error) {
			logout(event.cookies, event.locals);
		}
	}

	const response = await resolve(event);
	return response;
}

// Match the protected routes to the incoming req path
const protectedRouteMatcher = (path: string, routes: string[]): boolean =>
	routes.some((r) => path.startsWith(r));

// Get a new set of tokens
async function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
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

	try {
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
			user.token_version + 1
		);

		return {
			accessToken,
			refreshToken: newRefreshToken
		};
	} catch (error) {
		// DB Error
		return null;
	}
}

// Refresh logic to revalidate the user auth
async function attemptTokenRefresh(cookies: Cookies): Promise<AuthUser | null> {
	const initialRefreshToken = cookies.get('refreshToken');

	if (!initialRefreshToken) return null;

	const tokenSet = await refreshTokens(initialRefreshToken);

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

// Verify the user auth with the access token
async function verifyAndFetchUser(accessToken: string, cookies: Cookies): Promise<AuthUser | null> {
	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};
	} catch (e) {
		return await attemptTokenRefresh(cookies);
	}
	try {
		const fetchedUser = await getUserById(verifiedAccessPayload.id);

		if (!fetchedUser) return null;

		return { id: fetchedUser.id };
	} catch (error) {
		// DB Error
		return null;
	}
}
