import { useApiQuery } from './useApi';

interface NewPostDraftResponse {
  redirectUrl: string;
}

export const useNewPostDraft = (groupId: string) => {
  return useApiQuery<NewPostDraftResponse>(
    ['groupd', 'draft', groupId],
    `/api/groups/${groupId}/posts/new`,
    {
      enabled: false,
    },
  );
};
