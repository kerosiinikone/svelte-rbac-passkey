import { DatabaseError } from '$lib/errors.js';
import {
	deletePasscodeEntry,
	getPasscodeEntry,
	getUserByEmail,
	setIsVerifiedUser
} from '$lib/server/operations';
import { setCookies, signTokenPayload } from '$lib/server/utils/auth.js';
import type { CookieParameters } from '$lib/types.js';
import { error, redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

const CODE_TIMEOUT = 10 * 60 * 1000;

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = Object.fromEntries(await request.formData());
		const inputCode = formData.code as string;
		const email: string = JSON.parse(cookies.get('pending_email') as string);

		if (!email) {
			return {
				error: 'No email found'
			};
		}

		try {
			// Get the LATEST code for a particular email
			const code = await getPasscodeEntry(email);

			// Check whether a code is stale -> only valid for 10 minutes
			const timeDiff = Math.abs(new Date().getTime() - code.created_at.getTime());

			if (timeDiff >= CODE_TIMEOUT) {
				return {
					error: 'Passcode auth failed'
				};
			}

			// Compare codes
			const isValid = await bcrypt.compare(inputCode, code.passcode);

			if (!isValid) {
				return {
					error: 'Passcode auth failed'
				};
			}

			// Clear cookie
			cookies.delete('pending_email', {
				path: '/'
			});

			// Delete passcode entry
			await deletePasscodeEntry(code);

			// Fetch user
			const dbUser = await getUserByEmail(email);

			if (!dbUser) {
				return {
					error: 'No user found'
				};
			}

			// Set user as verified
			await setIsVerifiedUser(dbUser.id);

			// Set cookies, log in, etc
			const { accessToken, refreshToken } = signTokenPayload(dbUser.id, dbUser.token_version);

			const cookieList: CookieParameters[] = [
				{ name: 'accessToken', val: accessToken, opts: { maxAge: 7 * 24 * 60 * 60 * 1000 } },
				{ name: 'refreshToken', val: refreshToken, opts: { maxAge: 15 * 60 * 1000 } }
			];

			setCookies(cookies, cookieList);

		} catch (err) {
			if (err instanceof DatabaseError) {
				return { error: err.message };
			}
			error(500);
		}
		return redirect(303, '/profile');
	}
};
