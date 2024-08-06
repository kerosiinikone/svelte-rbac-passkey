import { generateAuthenticationOptions } from '@simplewebauthn/server';

export const GET = async () => {
	const options = await generateAuthenticationOptions({
		rpID: 'localhost'
	});

	const res = new Response(JSON.stringify(options));

	res.headers.append('Content-Type', 'application/json');
	res.headers.append('challenge', options.challenge);

	return res;
};
