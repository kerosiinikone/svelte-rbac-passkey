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

		// Get the email from a secure cookie
		const email: string = JSON.parse(cookies.get('pending_email') as string);

		if (!email) {
			error(500, 'No Email');
		}

		// Get the LATEST code for a particular email
		const code = await getPasscodeEntry(email);

		// Check whether a code is stale -> only valid for 10 minutes
		const timeDiff = Math.abs(new Date().getTime() - code.created_at.getTime());

		if (timeDiff >= CODE_TIMEOUT) {
			error(400);
		}

		// Compare codes
		const isValid = await bcrypt.compare(inputCode, code.passcode);

		if (!isValid) {
			error(400);
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
			error(400);
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

		redirect(303, '/profile');
	}
};
