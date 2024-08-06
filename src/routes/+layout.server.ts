import { invalidateAll } from '$app/navigation';
import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import { usersTable } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Loading data -> header updates

// Make access token refresh into a global middleware for later use in both load and actions

export const load = async ({ cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');

	if (locals.user) {
		return { user: locals.user };
	}

	if (!accessToken) {
		try {
			const res = await fetch('/api/auth/refresh');
			if (!res.ok) {
				// Logout ->
			}
			const newAccessToken = cookies.get('accessToken');

			if (!newAccessToken) {
				// Logout
				return;
			}

			const loggedInUser = await verifyAndFetchUser(newAccessToken);

			if (!loggedInUser) {
				// Automatic refresh with refreshToken, if not possible -> logout sequence
				return;
			}

			locals.user = loggedInUser.id;

			return { user: locals.user };
		} catch (e) {
			// Logout ->
		}
		return;
	}

	const loggedInUser = await verifyAndFetchUser(accessToken);

	if (!loggedInUser) {
		// Automatic refresh with refreshToken, if not possible -> logout sequence
		return;
	}

	locals.user = loggedInUser.id;

	// Revalidate pages to trigger a new load function ???

	return { user: loggedInUser };
};

// Temp: Make into a real helper func
async function verifyAndFetchUser(accessToken: string) {
	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};
	} catch (e) {
		// Automatic refresh with refreshToken, if not possible -> logout sequence
		error(500, 'Invalid token');
	}

	return await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, verifiedAccessPayload.id))
		.then((res) => res[0] ?? null);
}
