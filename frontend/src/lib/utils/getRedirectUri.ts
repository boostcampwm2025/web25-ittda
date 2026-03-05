type GetRedirectUriArg = {
  provider: 'kakao' | 'google';
  callback?: string;
  forceAccountSelect?: boolean;
  mobile?: boolean;
};

export const getRedirectUri = ({
  provider,
  callback,
  forceAccountSelect = false,
  mobile = false,
}: GetRedirectUriArg) => {
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/auth/${provider}`;

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

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};
