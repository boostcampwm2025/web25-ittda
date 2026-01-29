export const POST_DRAFT_KIND_VALUES = ['CREATE', 'EDIT'] as const;

export type PostDraftKind = (typeof POST_DRAFT_KIND_VALUES)[number];
