const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

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

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (hasBody && !(rest.body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(detail.detail ?? 'Request failed', response.status);
  }

  return response.json() as Promise<T>;
}

export { API_BASE_URL };
