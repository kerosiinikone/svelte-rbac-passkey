import { handleClientRegistration } from '$lib/passkeys';
import * as browser from '@simplewebauthn/browser';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

global.navigator = {
	credentials: {
		create: vi.fn()
	}
} as any;

global.window = {
	PublicKeyCredential: () => {}
} as any;

vi.mock('@simplewebauthn/browser', async () => {
	return {
		__esModule: true,
		...(await vi.importActual('@simplewebauthn/browser'))
	};
});

beforeEach(() => {
	vi.clearAllMocks();
});

describe('passkey generation', async () => {
	it('generate valid passkey options', async () => {
		vi.spyOn(browser, 'browserSupportsWebAuthn').mockReturnValue(true);

		const options = await generateRegistrationOptions({
			rpName: 'test',
			rpID: 'localhost',
			userName: 'test',
			challenge: 'test',
			attestationType: 'none',
			authenticatorSelection: {
				residentKey: 'discouraged',
				userVerification: 'preferred'
			},
			supportedAlgorithmIDs: [-7, -257]
		});

		const mockCredential = {
			id: 'test',
			rawId: new Uint8Array(),
			response: {
				attestationObject: new Uint8Array(),
				clientDataJSON: new Uint8Array(),
				getTransports: vi.fn().mockReturnValue([]),
				getPublicKeyAlgorithm: vi.fn().mockReturnValue(1),
				getPublicKey: vi.fn().mockReturnValue(new Uint8Array()),
				getAuthenticatorData: vi.fn().mockReturnValue(new Uint8Array())
			},
			type: 'public-key',
			getClientExtensionResults: vi.fn().mockReturnValue({}),
			authenticatorAttachment: 'platform'
		};
		(navigator.credentials.create as Mock).mockResolvedValue(mockCredential);

		// Unit test function
		const result = await handleClientRegistration(options);

		expect(result).toEqual({
			id: 'test',
			rawId: '',
			response: {
				attestationObject: '',
				clientDataJSON: '',
				transports: [],
				publicKeyAlgorithm: 1,
				publicKey: '',
				authenticatorData: ''
			},
			type: 'public-key',
			clientExtensionResults: {},
			authenticatorAttachment: 'platform'
		});
	});
});
