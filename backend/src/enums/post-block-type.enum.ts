export const PostBlockType = {
  DATE: 'DATE',
  TIME: 'TIME',
  TEXT: 'TEXT',
  MOOD: 'MOOD',
  TAG: 'TAG',
  RATING: 'RATING',
  LOCATION: 'LOCATION',
  IMAGE: 'IMAGE',
  TABLE: 'TABLE',
  MEDIA: 'MEDIA',
} as const;

export type PostBlockType = (typeof PostBlockType)[keyof typeof PostBlockType];
