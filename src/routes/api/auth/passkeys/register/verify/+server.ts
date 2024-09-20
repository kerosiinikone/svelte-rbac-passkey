import { JWT_SECRET } from '$env/static/private';
import db from '$lib/server/db/index.js';
import { userPasskeyOptions, usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const ORIGIN = `http://localhost:5173`;

export const POST = async ({ cookies, request }) => {
	const body = await request.json();
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

	let verification;

	try {
		verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: latestOption.challenge,
			expectedOrigin: ORIGIN,
			expectedRPID: 'localhost'
		});
	} catch (e) {
		error(400);
	}

	const base64Data = Buffer.from(verification.registrationInfo?.credentialPublicKey!).toString(
		'base64'
	);

	await db.insert(webPasskeyTable).values({
		credPublicKey: base64Data,
		credId: verification.registrationInfo?.credentialID!,
		internalUserId: user.id,
		webauthnUserId: latestOption.webauthnUserId,
		counter: verification.registrationInfo?.counter!,
		backupStatus: verification.registrationInfo?.credentialBackedUp!
	});

	if (verification.verified && verification.registrationInfo) {
		// Clean up the db
		await db.delete(userPasskeyOptions).where(eq(userPasskeyOptions.id, latestOption.id));

		// Add the returned device to the user's list of devices
		// Keep a table of devices in a one-to-many relationship between users and devices
	} else {
		error(400, 'Verification failed!');
	}

	return json(verification);
};
