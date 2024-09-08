import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { usersTable } from '$lib/server/db/schema';
import { error, type Cookies, type RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

type User = {
	id: string;
};

interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}

const protectedRoutes = ['/', '/profile'];

export async function handle({ event, resolve }) {
	const accessToken = event.cookies.get('accessToken');

	if (protectedRouteMatcher(event, protectedRoutes)) {
		const user: User | null = await verifyAndFetchUser(
			accessToken ?? '',
			event.cookies,
			event.fetch
		);
		if (!user) {
			logout(event.cookies, event.locals);
		} else {
			event.locals.user = user?.id;
		}
	}

	const response = await resolve(event);
	return response;
}

function protectedRouteMatcher(
	e: RequestEvent<Partial<Record<string, string>>, string | null>,
	routes: string[]
): boolean {
	return routes.some((r) => e.url.pathname.startsWith(r));
}

async function fetchToken(f: (...args: any) => Promise<Response>): Promise<TokenResponse> {
	const res = await f('/api/auth/refresh');
	if (!res.ok) {
		error(res.status);
	}
	return res.json() as Promise<TokenResponse>;
}

async function refresh(
	cookies: Cookies,
	f: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
): Promise<User | null> {
	const initialRefreshToken = cookies.get('refreshToken');

	if (!initialRefreshToken) return null;

	try {
		const { refreshToken, accessToken } = await fetchToken(f);

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

		const loggedInUser = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};

		if (!loggedInUser.id) {
			return null;
		}

		return { id: loggedInUser.id };
	} catch (e) {
		return null;
	}
}

async function verifyAndFetchUser(
	accessToken: string,
	cookies: Cookies,
	f: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
): Promise<User | null> {
	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};
	} catch (e) {
		return await refresh(cookies, f);
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
