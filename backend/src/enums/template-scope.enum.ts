export const TemplateScope = {
  SYSTEM: 'SYSTEM',
  ME: 'ME',
  GROUP: 'GROUP',
} as const;

export type TemplateScope = (typeof TemplateScope)[keyof typeof TemplateScope];
