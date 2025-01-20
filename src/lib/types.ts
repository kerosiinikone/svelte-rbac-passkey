import type { SerializeOptions } from 'cookie';

export enum Roles {
	DEFAULT = 'DEFAULT',
	PREMIUM = 'PREMIUM',
	ADMIN = 'ADMIN'
}

export type CookieParameters = {
	name: string;
	val: string;
	opts: SerializeOptions;
};

export interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}
