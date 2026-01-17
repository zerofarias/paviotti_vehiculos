/**
 * Utility function to make authenticated API requests
 * Automatically includes the auth token from localStorage
 */

export const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = localStorage.getItem('accessToken');

    const headers = new Headers(options.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && options.method !== 'GET') {
        headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
        ...options,
        headers
    });
};

/**
 * Shorthand for GET requests
 */
export const apiGet = (url: string) => authenticatedFetch(url);

/**
 * Shorthand for POST requests
 */
export const apiPost = (url: string, data: any) =>
    authenticatedFetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });

/**
 * Shorthand for PUT requests
 */
export const apiPut = (url: string, data: any) =>
    authenticatedFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });

/**
 * Shorthand for DELETE requests
 */
export const apiDelete = (url: string) =>
    authenticatedFetch(url, {
        method: 'DELETE'
    });
