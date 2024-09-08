import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import { usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const ORIGIN = `http://localhost:5173`;

export const POST = async ({ request, cookies }) => {
	const body = await request.json();
	const challenge = request.headers.get('challenge') as string;

	const userPasskey = await db
		.select()
		.from(webPasskeyTable)
		.where(eq(webPasskeyTable.credId, body.id))
		.then((res) => res[0] ?? null);

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
	} catch (error) {
		console.error(error);
	}

	if (verification?.verified && verification.authenticationInfo) {
		const verifiedUser = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, userPasskey.internalUserId))
			.then((res) => res[0] ?? null);

		if (!verifiedUser) {
			error(400, 'No user found');
		}

		const accessPayload = {
			id: verifiedUser.id
		};

		const refreshPayload = {
			id: verifiedUser.id,
			version: verifiedUser.token_version
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

		return json(verification);
	} else {
		error(400, 'Verification failed!');
	}
};
