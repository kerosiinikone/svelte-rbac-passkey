import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import { usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { Roles } from '$lib/types.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { invalidate } from '$app/navigation';

export const load = async ({ parent, locals }) => {
	// Process accessToken here ?

	const data = await parent();

	if (!data.user || !locals.user) {
		redirect(303, '/login');
	}

	const userId = data.user || locals.user;

	// Reveal only what is necessary
	// Promise.all()

	const user = await db
		.select({
			email: usersTable.email,
			verified: usersTable.verified,
			role: usersTable.role
		})
		.from(usersTable)
		.where(eq(usersTable.id, userId))
		.then((res) => res[0] ?? null);

	const userPasskeys = await db
		.select()
		.from(webPasskeyTable)
		.where(eq(webPasskeyTable.internalUserId, userId));

	if (!user) {
		return error(400);
	}

	return { user, verifiedPasskeys: userPasskeys };
};

export const actions = {
	deletePasskey: async ({ request }) => {
		// Check for accessToken ????????
		// Set max length requirements
		const schema = z.string();

		const formData = await request.formData();
		const pid = formData.get('pid') as string;

		const result = schema.safeParse(pid);

		if (!result.success) {
			fail(400);
		}

		await db.delete(webPasskeyTable).where(eq(webPasskeyTable.credId, pid));

		redirect(303, '/profile');
	},
	switchRole: async ({ request, cookies }) => {
		const schema = z.nativeEnum(Roles);
		const accessToken = cookies.get('accessToken');

		if (!accessToken) {
			// Logout
			return;
		}

		const loggedInUser = await verifyAndFetchUser(accessToken);

		if (!loggedInUser) {
			// Automatic refresh with refreshToken, if not possible -> logout sequence
			return;
		}

		const formData = await request.formData();
		const role = formData.get('role') as string;

		const result = schema.safeParse(role);

		if (!result.success) {
			fail(400);
		}

		await db
			.update(usersTable)
			.set({
				role: role as Roles
			})
			.where(eq(usersTable.id, loggedInUser.id));
	}
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
