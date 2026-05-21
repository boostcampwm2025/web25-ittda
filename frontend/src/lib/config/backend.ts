const LOCAL_BACKEND_ORIGIN = 'http://localhost:4000';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function getDevelopmentBackendOrigin() {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_DEVELOPMENT_API_URL || LOCAL_BACKEND_ORIGIN,
  );
}

export function getBackendTarget() {
  return process.env.NEXT_PUBLIC_BACKEND_TARGET === 'local' ? 'local' : 'dev';
}

export function getBackendOrigin() {
  if (process.env.NODE_ENV === 'production') {
    return trimTrailingSlash(
      process.env.NEXT_PUBLIC_PRODUCTION_API_URL ||
        getDevelopmentBackendOrigin(),
    );
  }

  if (getBackendTarget() === 'local') {
    return LOCAL_BACKEND_ORIGIN;
  }

  return getDevelopmentBackendOrigin();
}

export function getBackendApiBaseUrl() {
  const origin = getBackendOrigin();
  return origin.endsWith('/v1') ? origin : `${origin}/v1`;
}
