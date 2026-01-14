type GetRedirectUriArg = {
  provider: 'kakao' | 'google';
};

export const getRedirectUri = ({ provider }: GetRedirectUriArg) => {
  return `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/auth/${provider}`;
};
