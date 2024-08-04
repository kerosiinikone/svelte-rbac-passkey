import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import { usersTable } from '$lib/server/db/schema.js';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const GET = async ({ cookies }) => {
	const accessToken = cookies.get('accessToken');
	if (!accessToken) {
		error(400);
	}

	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken, JWT_SECRET) as {
			id: string;
			version: number;
			exp: number;
		};
	} catch (e) {
		return error(400);
	}

	const user = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, verifiedAccessPayload.id))
		.then((res) => res[0] ?? null);

	if (!user) {
		return error(400);
	}

	return json(user);
};
