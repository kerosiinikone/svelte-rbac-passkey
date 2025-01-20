import { EMAIL_ADDRESS } from '$env/static/private';
import { DatabaseError, ValidationError } from '$lib/errors.js';
import { User } from '$lib/server/models/user/index.js';
import { createPasscodeEntry, createUser, getUserByEmail } from '$lib/server/operations';
import { createPasscode, setCookies, signTokenPayload } from '$lib/server/utils/auth.js';
import { saveUser } from '$lib/server/utils/dto.js';
import { EmailService } from '$lib/server/utils/email.js';
import { Roles, type CookieParameters } from '$lib/types.js';
import { error, redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import { z } from 'zod';

export const actions = {
	signin: async ({ request, cookies, locals }) => {
		const schema = z.string().email();
		const formData = Object.fromEntries(await request.formData());
		const email = formData.email as string;
		const result = schema.safeParse(email);

		if (!result.success) {
			return {
				error: ValidationError.parseZodError(result.error)
			};
		}
		// Check if the email already exists
		const existingEmail = await getUserByEmail(email);

		if (existingEmail) {
			// Passcode sequence -> verify this is feasible and the right way with Gemini
			const passcode = createPasscode();
			// Send email -> should this be handled more securely / some other way?
			try {
				const mailer = new EmailService({
					host: 'smtp.gmail.com',
					port: 465,
					isSecure: true,
					provider: 'nodemailer'
				});

				const mailOpts = {
					from: EMAIL_ADDRESS,
					to: email,
					subject: passcode
				};

				await mailer.sendMail(mailOpts);

				const hashedCode = await bcrypt.hash(passcode, 10);
				await createPasscodeEntry(hashedCode, email);

				cookies.set('pending_email', JSON.stringify(email), {
					path: '/',
					secure: true,
					httpOnly: true,
					maxAge: 1000 * 60 * 6 // 5 minutes
				});
			} catch (err) {
				if (err instanceof DatabaseError) {
					return { error: err.message };
				}
				console.log(err);
				error(500);
			}
			redirect(303, '/login/confirmation');
		}

		try {
			const user = new User(crypto.randomUUID(), Roles.DEFAULT, email, false);

			await createUser(saveUser(user));

			const { accessToken, refreshToken } = signTokenPayload(user.getId(), user.getTokenVersion());

			const cookieList: CookieParameters[] = [
				{ name: 'accessToken', val: accessToken, opts: { maxAge: 7 * 24 * 60 * 60 * 1000 } },
				{ name: 'refreshToken', val: refreshToken, opts: { maxAge: 15 * 60 * 1000 } }
			];

			setCookies(cookies, cookieList);

			cookies.delete('pending_email', {
				path: '/'
			});

			locals.user = user.getId();
		} catch (err) {
			if (err instanceof DatabaseError) {
				return { error: err.message };
			}
			error(500);
		}
		redirect(303, '/login/create-passkey');
	}
};
