import { getPasskeyById, getUserById } from '$lib/server/operations';
import { setCookies, signTokenPayload } from '$lib/server/utils/auth.js';
import type { CookieParameters } from '$lib/types.js';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';

const noAuth: () => never = error.bind(null, 401, 'No auth');

const ORIGIN = `http://localhost:5173`;

export const POST = async ({ request, cookies }) => {
	const body = await request.json();
	const challenge = request.headers.get('challenge') as string;

	const userPasskey = await getPasskeyById(body.id);

	if (!userPasskey) {
		error(400, `Could not find passkey`);
	}

	const credPublicKeyBytes = Uint8Array.from(Buffer.from(userPasskey.credPublicKey, 'base64'));

	let verification;

	try {
		verification = await verifyAuthenticationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: ORIGIN,
			expectedRPID: 'localhost',
			authenticator: {
				credentialID: userPasskey.credId,
				credentialPublicKey: credPublicKeyBytes,
				counter: userPasskey.counter
			}
		});
	} catch (err) {
		error(400);
	}

	if (verification?.verified && verification.authenticationInfo) {
		const verifiedUser = await getUserById(userPasskey.internalUserId);

		if (!verifiedUser) {
			noAuth();
		}

		const { refreshToken, accessToken } = signTokenPayload(
			verifiedUser.id,
			verifiedUser.token_version
		);

		const cookieList: CookieParameters[] = [
			{ name: 'accessToken', val: accessToken, opts: { maxAge: 7 * 24 * 60 * 60 * 1000 } },
			{ name: 'refreshToken', val: refreshToken, opts: { maxAge: 15 * 60 * 1000 } }
		];

		setCookies(cookies, cookieList);

		return json(verification);
	} else {
		error(400, 'Verification failed!');
	}
};
