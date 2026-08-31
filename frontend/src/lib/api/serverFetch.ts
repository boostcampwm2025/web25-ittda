import { auth } from '@/auth';
import { getBackendOrigin } from '@/lib/config/backend';

export async function serverFetch(url: string, options: RequestInit = {}) {
  const session = await auth();
  const accessToken = session?.accessToken;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const baseUrl = getBackendOrigin();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
  }
  return response;
}
