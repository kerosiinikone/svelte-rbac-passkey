import type { CookieSerializeOptions } from 'cookie';

export enum Roles {
	DEFAULT = 'DEFAULT',
	PREMIUM = 'PREMIUM',
	ADMIN = 'ADMIN'
}

export type CookieParameters = {
	name: string;
	val: string;
	opts: CookieSerializeOptions;
};

export interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}
