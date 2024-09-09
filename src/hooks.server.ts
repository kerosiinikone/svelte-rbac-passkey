import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { usersTable } from '$lib/server/db/schema';
import { type Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}

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
	const user = await db
		.select({
			version: usersTable.token_version,
			id: usersTable.id,
			token_version: usersTable.token_version
		})
		.from(usersTable)
		.where(eq(usersTable.id, verifiedRefreshPayload.id))
		.then((res) => res[0] ?? null);

	if (!user) {
		return null;
	}

	if (verifiedRefreshPayload.version !== user.version) {
		return null;
	}

	// Sign new tokens
	const accessPayload = {
		id: user.id
	};

	const refreshPayload = {
		id: user.id,
		version: user.token_version
	};

	const accessToken = jwt.sign(accessPayload, JWT_SECRET);
	const newRefreshToken = jwt.sign(refreshPayload, JWT_SECRET);

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

		cookies.set('accessToken', accessToken, {
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			secure: true
		});
		cookies.set('refreshToken', refreshToken, {
			path: '/',
			maxAge: 15 * 60 * 1000,
			httpOnly: true,
			secure: true
		});

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

	const fetchedUser = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, verifiedAccessPayload.id))
		.then((res) => res[0] ?? null);

	if (!fetchedUser) return null;

	return { id: fetchedUser.id };
}

function logout(cookies: Cookies, locals: App.Locals) {
	cookies.delete('accessToken', { path: '/' });
	cookies.delete('refreshToken', { path: '/' });
	locals.user = undefined;
}
