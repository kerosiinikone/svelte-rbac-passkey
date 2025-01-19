import { getUserById } from '$lib/server/operations/users.operations';
import { logout, setCookies, signTokenPayload, verifyJWT } from '$lib/server/utils/auth';
import type { CookieParameters, TokenResponse } from '$lib/types';
import { type Cookies } from '@sveltejs/kit';

type AuthUser = {
	id: string;
};

type RefreshTokenPayload = {
	id: string;
	version: number;
	exp: number;
}

type AccessTokenPayload = {
	id: string;
	exp: number;
}

const protectedRoutes = ['/', '/profile'];

export async function handle({ event, resolve }) {
	const accessToken = event.cookies.get('accessToken');

	if (protectedRouteMatcher(event.url.pathname, protectedRoutes)) {
		try {
			const user: AuthUser | null = await verifyAndFetchUser(accessToken ?? '', event.cookies);
			if (!user) {
				logout(event.cookies, event.locals);
			} else {
				event.locals.user = user?.id;
			}
		} catch (error) {
			console.error('Error verifying user:', error);
			logout(event.cookies, event.locals);
		}
	}
	return await resolve(event);
}

async function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
	try {
		const verifiedRefreshPayload = verifyJWT<RefreshTokenPayload>(refreshToken);
		const user = await getUserById(verifiedRefreshPayload.id);

		if (!user || verifiedRefreshPayload.version !== user.token_version) {
            return null;
        }
        const { accessToken, refreshToken: newRefreshToken } = signTokenPayload(
            user.id,
            user.token_version + 1
        );
        return {
            accessToken,
            refreshToken: newRefreshToken
        };
	} catch (error) {
		return null;
	}
}

async function handleRefreshToken(cookies: Cookies): Promise<AuthUser | null> {
	const initialRefreshToken = cookies.get('refreshToken');
	if (!initialRefreshToken) return null;

	const tokens = await refreshTokens(initialRefreshToken);
    if (tokens) {
		const cookieList: CookieParameters[] = [
			{ name: 'accessToken', val: tokens.accessToken, opts: { maxAge: 7 * 24 * 60 * 60 * 1000 } },
			{ name: 'refreshToken', val: tokens.refreshToken, opts: { maxAge: 15 * 60 * 1000 } }
		];
        setCookies(cookies, cookieList);
		
		const payload = verifyJWT<AccessTokenPayload>(tokens.accessToken);
        const user = await getUserById(payload.id);
        return user ? { id: user.id } : null;
    }
    return null;
}

async function verifyAndFetchUser(token: string, cookies: Cookies): Promise<AuthUser | null> {
    try {
        const payload = verifyJWT<AccessTokenPayload>(token);
        if (payload.exp < Date.now() / 1000) {
			console.log('Token expired, refreshing...');
			return await handleRefreshToken(cookies);
        }
        const user = await getUserById(payload.id);
        return user ? { id: user.id } : null;
    } catch (error) {
        console.error('Error verifying token:', error);
        const refreshToken = cookies.get('refreshToken');
        if (refreshToken) {
            return await handleRefreshToken(cookies);
        }
        return null;
    }
}

const protectedRouteMatcher = (path: string, routes: string[]): boolean =>
	routes.some((r) => path.startsWith(r));