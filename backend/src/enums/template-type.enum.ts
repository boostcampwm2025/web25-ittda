export const TemplateType = {
  DIARY: 'DIARY',
  MOVIE: 'MOVIE',
  MUSICAL: 'MUSICAL',
  THEATER: 'THEATER',
  TRAVEL: 'TRAVEL',
  MEMO: 'MEMO',
  ETC: 'ETC',
} as const;

export type TemplateType = (typeof TemplateType)[keyof typeof TemplateType];
