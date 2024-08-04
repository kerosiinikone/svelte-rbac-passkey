import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db/index.js';
import { userPasskeyOptions, usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const ORIGIN = `http://localhost:5173`;

export const POST = async ({ cookies, request }) => {
	const req = request.clone();
	const accessToken = cookies.get('accessToken');

	let verifiedAccessPayload;

	try {
		verifiedAccessPayload = jwt.verify(accessToken!, JWT_SECRET) as {
			id: string;
			exp: number;
		};
	} catch (e) {
		// Automatic refresh with refreshToken, if not possible -> logout sequence
		error(500, 'Invalid token');
	}

	// For testing:
	const user = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, verifiedAccessPayload.id))
		.then((res) => res[0] ?? null);

	// Fetch the lastest option
	const latestOption = await db
		.select()
		.from(userPasskeyOptions)
		.orderBy(desc(userPasskeyOptions.created_at))
		.where(eq(userPasskeyOptions.userId, user.id))
		.then((res) => res[0] ?? null);

	const options = JSON.parse(latestOption.options);

	let verification;

	try {
		verification = await verifyRegistrationResponse({
			response: await req.json(),
			expectedChallenge: options.challenge,
			expectedOrigin: ORIGIN,
			expectedRPID: 'localhost'
		});
	} catch (e) {
		error(400);
	}

	const arr = new Uint8Array(verification.registrationInfo?.credentialPublicKey!);
	const decoder = new TextDecoder();
	const credentialPublicKeyString = decoder.decode(arr);

	await db.insert(webPasskeyTable).values({
		credPublicKey: credentialPublicKeyString,
		credId: verification.registrationInfo?.credentialID!,
		internalUserId: user.id,
		webauthnUserId: options.user.id,
		counter: verification.registrationInfo?.counter!,
		backupStatus: verification.registrationInfo?.credentialBackedUp!
	});

	if (verification.verified) {
		// Set user status to verified!
	}

	return json(verification);
};
