import { db } from '$lib/server/db/index.js';
import { passcodeTable, usersTable } from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { error, fail, redirect } from '@sveltejs/kit';
import { JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

const CODE_TIMEOUT = 10 * 60 * 1000;

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = Object.fromEntries(await request.formData());
		const inputCode = formData.code as string;

		// Get the email from a secure cookie
		const email: string = JSON.parse(cookies.get('pending_email') as string);

		if (!email) {
			error(500, 'No Email');
		}

		// Get the LATEST code for a particular email
		const code = await db
			.select({
				code: passcodeTable.passcode,
				id: passcodeTable.id,
				created_at: passcodeTable.created_at
			})
			.from(passcodeTable)
			.orderBy(desc(passcodeTable.created_at))
			.where(eq(passcodeTable.email, email))
			.then((res) => res[0] ?? null);

		// Check whether a code is stale -> only valid for 10 minutes
		const timeDiff = Math.abs(new Date().getTime() - code.created_at.getTime());

		if (timeDiff >= CODE_TIMEOUT) {
			error(400);
		}

		// Compare codes
		const isValid = await bcrypt.compare(inputCode, code.code);

		if (!isValid) {
			error(400);
		}

		// Clear cookie
		cookies.delete('pending_email', {
			path: '/'
		});

		// Delete passcode entry
		await db.delete(passcodeTable).where(eq(passcodeTable.id, code.id));

		// Fetch user
		const user = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.then((res) => res[0] ?? null);

		if (!user) {
			error(400);
		}

		// Set user as verified
		await db
			.update(usersTable)
			.set({
				verified: true
			})
			.where(eq(usersTable.id, user.id));

		// Set cookies, log in, etc
		const accessPayload = {
			id: user.id
		};

		const refreshPayload = {
			id: user.id,
			version: user.token_version
		};

		const accessToken = jwt.sign(accessPayload, JWT_SECRET);
		const refreshToken = jwt.sign(refreshPayload, JWT_SECRET);

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

		redirect(303, '/profile');
	}
};
