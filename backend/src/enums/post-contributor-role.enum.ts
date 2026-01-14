export const PostContributorRole = {
  AUTHOR: 'AUTHOR',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type PostContributorRole =
  (typeof PostContributorRole)[keyof typeof PostContributorRole];
