import { JWT_SECRET } from '$env/static/private';
import { getUserById, getUserPasskeys, saveUserPasskeyOptions } from '$lib/server/operations';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { error, json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const noAuth: () => never = error.bind(null, 401, 'No auth');

export const GET = async ({ cookies }) => {
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

	// Handle possible db error?
	const user = await getUserById(verifiedAccessPayload.id);

	if (!user) {
		noAuth();
	}

	const userPasskeys = await getUserPasskeys(user.id);

	const options = await generateRegistrationOptions({
		rpName: 'Svelte Demo', // Example
		rpID: 'localhost', // Make into env vars
		userName: user.email,
		attestationType: 'none',
		excludeCredentials: userPasskeys.map((passkey) => ({
			id: passkey.credId
		})),
		authenticatorSelection: {
			residentKey: 'discouraged',
			userVerification: 'preferred'
		},
		supportedAlgorithmIDs: [-7, -257]
	});

	// Could also be saved in the session object, but I'm not using sessions
	await saveUserPasskeyOptions(user.id, options);

	return json(options);
};
