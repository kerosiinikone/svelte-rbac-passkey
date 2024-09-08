// Wrapper for all requests

import { error } from '@sveltejs/kit';

// TODO: Options, headers, accessToken, etc abstracted here -> move to utils later and use on all requests

interface RequestParams {
	f: (...args: any) => Promise<Response>;
	url: string;
	method?: string;
	opts?: Record<string, any>;
}

export async function callAPI<T>({ f, url }: RequestParams): Promise<T> {
	const res = await f(url);
	if (!res.ok) {
		error(res.status);
	}
	return res.json() as Promise<T>;
}
