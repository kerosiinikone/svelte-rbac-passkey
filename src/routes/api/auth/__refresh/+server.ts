import { JWT_SECRET } from '$env/static/private';
import db from '$lib/server/db/index.js';
import { usersTable } from '$lib/server/db/schema.js';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const POST = async ({ request }) => {
	const refreshToken: string = await request.json();

	if (!refreshToken) {
		error(400);
	}

	let verifiedRefreshPayload;

	try {
		verifiedRefreshPayload = jwt.verify(refreshToken, JWT_SECRET) as {
			id: string;
			version: number;
			exp: number;
		};
	} catch (e) {
		return error(400);
	}

	// Check expiration -> "exp" !

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
		return error(400);
	}

	if (verifiedRefreshPayload.version !== user.version) {
		return error(400);
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

	return json({
		accessToken,
		refreshToken: newRefreshToken
	});
};
