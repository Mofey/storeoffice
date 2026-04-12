const isLoopbackHost = (value: string) => value === '127.0.0.1' || value === 'localhost';

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';
  }

  const currentHost = window.location.hostname;
  const configuredBaseUrl =
    import.meta.env.VITE_API_BASE_URL ??
    (isLoopbackHost(currentHost) ? 'http://127.0.0.1:8000/api' : '/api');

  if (configuredBaseUrl.startsWith('/')) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  try {
    const resolvedUrl = new URL(configuredBaseUrl);

    if (isLoopbackHost(resolvedUrl.hostname) && isLoopbackHost(currentHost) && resolvedUrl.hostname !== currentHost) {
      resolvedUrl.hostname = currentHost;
      return resolvedUrl.toString().replace(/\/$/, '');
    }
  } catch {
    return configuredBaseUrl;
  }

  return configuredBaseUrl;
};

const API_BASE_URL = resolveApiBaseUrl();
export const SESSION_TOKEN_SENTINEL = '__cookie_session__';

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  const hasBody = rest.body !== undefined && rest.body !== null;

  if (token && token !== SESSION_TOKEN_SENTINEL) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (hasBody && !(rest.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    cache: rest.cache ?? 'no-store',
    credentials: rest.credentials ?? 'include',
    headers: requestHeaders,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(detail.detail ?? 'Request failed', response.status);
  }

  return response.json() as Promise<T>;
}

const wait = (delayMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });

const shouldRetryApiRequest = (error: unknown) =>
  error instanceof ApiError
    ? error.status >= 500 || error.status === 408 || error.status === 429
    : true;

export async function apiRequestWithRetry<T>(
  path: string,
  options: RequestOptions = {},
  retries = 2,
  delayMs = 450
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await apiRequest<T>(path, options);
    } catch (error) {
      if (attempt >= retries || !shouldRetryApiRequest(error)) {
        throw error;
      }
      attempt += 1;
      await wait(delayMs * attempt);
    }
  }
}

export { API_BASE_URL };
