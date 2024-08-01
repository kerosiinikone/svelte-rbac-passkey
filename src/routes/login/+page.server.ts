import { db } from '$lib/server/db/index.js';
import { passcodeTable, Roles, usersTable } from '$lib/server/db/schema.js';
import createPasscode from '$lib/server/helpers/createPasscode.js';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { EMAIL_ADDRESS, EMAIL_PASSWORD } from '$env/static/private';

export const actions = {
	signin: async ({ request, cookies }) => {
		const schema = z.string().email();

		const formData = await request.formData();
		const email = formData.get('email') as string;

		const result = schema.safeParse(email);

		if (!result.success) {
			fail(400);
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

			cookies.set('email', JSON.stringify(email), {
				path: '/',
				secure: true,
				httpOnly: true
			});

			redirect(303, '/login/confirmation');
		}

		// If it doesn't, register a new account, prompt the user to add a passkey
		await db.insert(usersTable).values({
			id: crypto.randomUUID(),
			email,
			role: Roles.DEFAULT
		});

		// Set cookies and log the user in
		// Show the user the "Set Passkey" page

		return { success: true };
	}
};
