import { db } from '$lib/server/db/index.js';
import { passcodeTable, usersTable } from '$lib/server/db/schema.js';
import { createPasscode } from '$lib/server/utils/passcode.js';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { EMAIL_ADDRESS, EMAIL_PASSWORD, JWT_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';
import { Roles } from '$lib/types.js';

export const actions = {
	signin: async ({ request, cookies, locals }) => {
		const schema = z.string().email();

		const formData = Object.fromEntries(await request.formData());
		const email = formData.email as string;

		const result = schema.safeParse(email);

		if (!result.success) {
			error(400);
		}

		// Check if the email already exists
		const existingEmail = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.then((res) => res[0] ?? null);

		// If it does, start the passcode sequence
		if (existingEmail) {
			// Passcode sequence -> verify this is feasible and the right way with Gemini

			// Create code
			const passcode = createPasscode();

			// Send the email confirmation
			const transporter = nodemailer.createTransport({
				host: 'smtp.gmail.com',
				port: 587,
				secure: false,
				auth: {
					user: EMAIL_ADDRESS,
					pass: EMAIL_PASSWORD
				}
			});

			await transporter.sendMail({
				from: EMAIL_ADDRESS,
				to: email,
				subject: passcode
			});

			// Hash the code
			const hashedCode = await bcrypt.hash(passcode, 10);

			// Save the database entry
			await db.insert(passcodeTable).values({
				id: crypto.randomUUID(),
				email,
				passcode: hashedCode
			});

			cookies.set('pending_email', JSON.stringify(email), {
				path: '/',
				secure: true,
				httpOnly: true,
				maxAge: 1000 * 60 * 6 // 5 minutes
			});

			redirect(303, '/login/confirmation');
		}

		// If it doesn't, register a new account, prompt the user to add a passkey
		const user = await db
			.insert(usersTable)
			.values({
				id: crypto.randomUUID(),
				email,
				role: Roles.DEFAULT
			})
			.returning()
			.then((res) => res[0]);

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

		cookies.delete('pending_email', {
			path: '/'
		});

		locals.user = user.id;

		redirect(303, '/login/create-passkey');
	}
};
