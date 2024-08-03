import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import { usersTable } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Loading data -> header updates

export const load = async ({ cookies, locals }) => {
	const accessToken = cookies.get('accessToken');

	if (locals.user) {
		return { user: locals.user };
	}

	if (!accessToken) {
		// Automatic refresh with refreshToken, if not possible -> logout sequence
		return;
	}

	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			exp: number;
		};
	} catch (e) {
		error(500, 'Invalid token');
	}

	if (!verifiedAccessPayload) {
		error(500, 'Invalid token');
	}

	const loggedInUser = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, verifiedAccessPayload.id))
		.then((res) => res[0] ?? null);

	if (!loggedInUser) {
		return {};
	}

	locals.user = loggedInUser;

	// Revalidate pages to trigger a new load function ???

	return { user: loggedInUser };
};
