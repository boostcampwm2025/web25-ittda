type GetRedirectUriArg = {
  provider: 'kakao' | 'google';
  callback?: string;
};

export const getRedirectUri = ({ provider, callback }: GetRedirectUriArg) => {
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/auth/${provider}`;

  if (callback) {
    return `${baseUrl}?callback=${encodeURIComponent(callback)}`;
  }

  return baseUrl;
};
