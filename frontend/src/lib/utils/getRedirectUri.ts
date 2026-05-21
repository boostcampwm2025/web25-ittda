import { getBackendApiBaseUrl } from '@/lib/config/backend';

type GetRedirectUriArg = {
  provider: 'kakao' | 'google';
  callback?: string;
  forceAccountSelect?: boolean;
  mobile?: boolean;
  android?: boolean;
};

export const getRedirectUri = ({
  provider,
  callback,
  forceAccountSelect = false,
  mobile = false,
  android = false,
}: GetRedirectUriArg) => {
  const baseUrl = `${getBackendApiBaseUrl()}/auth/${provider}`;

  const params = new URLSearchParams();
  if (callback) {
    params.set('callback', callback);
  }
  if (forceAccountSelect) {
    params.set('prompt', 'select_account');
  }
  if (mobile) {
    params.set('mobile', 'true');
  }
  if (android) {
    params.set('android', 'true');
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
