// Wrapper for all requests

// TODO: Options, headers, accessToken, etc abstracted here -> move to utils later and use on all requests

type RequestMethod = 'GET' | 'POST';

export function createCaller(f: (url: string, init?: RequestInit) => Promise<Response>) {
	return async function <T>(url: string, method: RequestMethod = 'GET', opts: RequestInit = {}) {
		const res = await f(url, { method, ...opts });
		// TODO: Custom Errors?
		if (!res.ok) {
			throw new Error('');
		}
		return res.json() as Promise<T>;
	};
}
