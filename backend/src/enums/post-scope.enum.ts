export const PostScope = {
  PERSONAL: 'PERSONAL',
  GROUP: 'GROUP',
} as const;

export type PostScope = (typeof PostScope)[keyof typeof PostScope];
