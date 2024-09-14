// Wrapper for all requests

// TODO: Options, headers, accessToken, etc abstracted here -> move to utils later and use on all requests

type RequestMethod = 'GET' | 'POST';

export function createCaller(f: (url: string, init?: RequestInit) => Promise<Response>) {
	return async function <T>(
		url: string,
		method: RequestMethod = 'GET',
		opts: RequestInit & {
			includeHeaders?: boolean;
		} = {}
	) {
		const res = await f(url, { method, ...opts });
		if (!res.ok) {
			throw new Error('apiFetch error');
		}
		return {
			...(await res.json()),
			headers: opts.includeHeaders ? res.headers : undefined
		} as Promise<T>;
	};
}
