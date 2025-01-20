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

/**
 * Handles client-side passkey registration.
 * @param res - The registration options.
 * @returns The registration response.
 * @throws PasskeyError if registration fails.
 */
export async function handleClientRegistration(res: PublicKeyCredentialCreationOptionsJSON) {
    try {
        return await startRegistration(res);
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'InvalidStateError') {
                throw new PasskeyError('Authenticator was probably already registered by user');
            } else {
                throw new PasskeyError('Passkey registration failed', { cause: error.message });
            }
        } else {
            throw new PasskeyError('Unknown error during passkey registration');
        }
    }
}

/**
 * Initiates the passkey registration flow.
 * @returns True if registration is successful, false otherwise.
 */
export async function initiatePasskeyRegisterFlow(): Promise<boolean> {
    try {
        const res = await apiFetch<PublicKeyCredentialCreationOptionsJSON>(R_OPTIONS);
        const registrationResponse = await handleClientRegistration(res);

        const verificationResp = await apiFetch<VerifiedRegistrationResponse>(R_VERIFY, 'POST', {
            body: JSON.stringify(registrationResponse)
        });

        return verificationResp.verified;
    } catch (error) {
        console.error('Error during passkey registration flow:', error);
        return false;
    }
}

/**
 * Handles client-side passkey authentication.
 * @param res - The authentication options.
 * @returns The authentication response.
 * @throws PasskeyError if authentication fails.
 */
export async function handleClientAuthentication(res: PublicKeyCredentialRequestOptionsJSON) {
    try {
        return await startAuthentication(res);
    } catch (error) {
        if (error instanceof Error) {
            throw new PasskeyError('Passkey authentication failed', { cause: error.message });
        } else {
            throw new PasskeyError('Unknown error during passkey authentication');
        }
    }
}

/**
 * Initiates the passkey authentication flow.
 * @returns True if authentication is successful, false otherwise.
 */
export async function initiatePasskeyAuthFlow(): Promise<boolean> {
    try {
        const { headers, ...credentialRes } = await apiFetch<
            PublicKeyCredentialRequestOptionsJSON & { headers: Headers }
        >(A_OPTIONS, 'GET', { includeHeaders: true });
        const authenticationResponse = await handleClientAuthentication(credentialRes);

        const challenge = headers.get('challenge') as string;

        const verificationResp = await apiFetch<VerifiedAuthenticationResponse>(A_VERIFY, 'POST', {
            body: JSON.stringify(authenticationResponse),
            headers: {
                challenge: challenge
            }
        });

        return verificationResp.verified;
    } catch (error) {
        console.error('Error during passkey authentication flow:', error);
        return false;
    }
}