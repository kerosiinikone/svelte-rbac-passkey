import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type {
	VerifiedAuthenticationResponse,
	VerifiedRegistrationResponse
} from '@simplewebauthn/server';
import type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/types';
import { createCaller } from './api/request';
import { PasskeyError } from './errors';

const R_OPTIONS = '/api/auth/passkeys/register/options';
const R_VERIFY = '/api/auth/passkeys/register/verify';

const A_OPTIONS = '/api/auth/passkeys/authenticate/options';
const A_VERIFY = '/api/auth/passkeys/authenticate/verify';

const apiFetch = createCaller(fetch);

export async function handleClientRegistration(res: PublicKeyCredentialCreationOptionsJSON) {
	try {
		return await startRegistration(res);
	} catch (error) {
		let err = error as any;
		if (err.name === 'InvalidStateError') {
			throw new PasskeyError('Authenticator was probably already registered by user');
		} else {
			throw new PasskeyError('Passkey failed', { cause: JSON.stringify(err) });
		}
	}
}

export async function initiatePasskeyRegisterFlow(): Promise<boolean> {
	const res = await apiFetch<PublicKeyCredentialCreationOptionsJSON>(R_OPTIONS);
	const r = await handleClientRegistration(res);

	const verificationResp = await apiFetch<VerifiedRegistrationResponse>(R_VERIFY, 'POST', {
		body: JSON.stringify(r)
	});

	return verificationResp.verified;
}

export async function handleClientAuthentication(res: PublicKeyCredentialRequestOptionsJSON) {
	try {
		return await startAuthentication(res);
	} catch (error) {
		let err = error as any;
		throw new PasskeyError('Passkey failed', { cause: JSON.stringify(err) });
	}
}

export async function initiatePasskeyAuthFlow(): Promise<boolean> {
	const { headers, ...credentialRes } = await apiFetch<
		PublicKeyCredentialRequestOptionsJSON & { headers: Headers }
	>(A_OPTIONS, 'GET', { includeHeaders: true });
	const r = await handleClientAuthentication(credentialRes);

	const challenge = headers.get('challenge') as string;

	const verificationResp = await apiFetch<VerifiedAuthenticationResponse>(A_VERIFY, 'POST', {
		body: JSON.stringify(r),
		headers: {
			challenge: challenge
		}
	});

	return verificationResp.verified;
}
