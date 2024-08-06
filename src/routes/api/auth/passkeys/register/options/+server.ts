import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { userPasskeyOptions, usersTable, webPasskeyTable } from '$lib/server/db/schema.js';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export const GET = async ({ cookies }) => {
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

	const user = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, verifiedAccessPayload.id))
		.then((res) => res[0] ?? null);

	if (!user) {
		// Logout
		error(500, 'Invalid token');
	}

	const userPasskeys = await db
		.select({
			key: webPasskeyTable.credId
		})
		.from(webPasskeyTable)
		.leftJoin(usersTable, eq(usersTable.id, webPasskeyTable.internalUserId))
		.where(eq(usersTable.id, user.id));

	const options = await generateRegistrationOptions({
		rpName: 'Svelte Demo', // Example
		rpID: 'localhost', // Make into env vars
		userName: user.email,
		attestationType: 'none',
		excludeCredentials: userPasskeys.map((passkey) => ({
			id: passkey.key
		})),
		authenticatorSelection: {
			residentKey: 'discouraged',
			userVerification: 'preferred'
		},
		supportedAlgorithmIDs: [-7, -257]
	});

	// Could also be saved in the session object, but I'm not using sessions
	await db.insert(userPasskeyOptions).values({
		challenge: options.challenge,
		id: crypto.randomUUID(),
		userId: user.id,
		webauthnUserId: options.user.id
	});

	return json(options);
};
