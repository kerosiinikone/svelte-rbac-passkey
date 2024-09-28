import { JWT_SECRET } from '$env/static/private';
import {
	createPasskeyEntry,
	deleteLatestOptions,
	getLatestOptions,
	getUserById
} from '$lib/server/operations';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const noAuth: () => never = error.bind(null, 401, 'No auth');

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
		noAuth();
	}

	const user = await getUserById(verifiedAccessPayload.id);

	if (!user) {
		noAuth();
	}

	// Fetch the lastest option
	const latestOption = await getLatestOptions(user.id);

	let verification;

	try {
		verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: latestOption.challenge,
			expectedOrigin: ORIGIN,
			expectedRPID: 'localhost'
		});
	} catch (e) {
		// Throw a PasskeyError?
		error(400);
	}

	const base64Data = Buffer.from(verification.registrationInfo?.credentialPublicKey!).toString(
		'base64'
	);

	if (!verification.registrationInfo) error(400);

	await createPasskeyEntry({
		base64Data,
		latestOption,
		user: user.id,
		verification
	});

	if (verification.verified && verification.registrationInfo) {
		// Clean up the db
		await deleteLatestOptions(latestOption.id);

		// Add the returned device to the user's list of devices
		// Keep a table of devices in a one-to-many relationship between users and devices
	} else {
		error(400);
	}

	return json(verification);
};
