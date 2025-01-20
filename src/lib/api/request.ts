type RequestMethod = 'GET' | 'POST';

interface FetchOptions extends RequestInit {
    includeHeaders?: boolean;
    timeout?: number;
}

export function createCaller(f: (url: string, init?: RequestInit) => Promise<Response>, defaultHeaders: HeadersInit = {}) {
    return async function <T>(
        url: string,
        method: RequestMethod = 'GET',
        opts: FetchOptions = {}
    ): Promise<T> {
        const { includeHeaders, timeout, ...fetchOpts } = opts;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout || 5000);

        const headers = {
            ...defaultHeaders,
            ...fetchOpts.headers
        };

        try {
            const res = await f(url, { method, ...fetchOpts, headers, signal: controller.signal });
            clearTimeout(id);

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`apiFetch error: ${res.status} ${res.statusText} - ${errorText}`);
            }

            const data = await res.json();
            return {
                ...data,
                headers: includeHeaders ? res.headers : undefined
            } as T;
        } catch (error) {
            if (controller.signal.aborted && error instanceof DOMException) {
                throw new Error('apiFetch error: Request timed out');
            }
            throw error;
        }
    };
}