import { useApiPost, useApiQuery } from './useApi';

interface NewPostDraftResponse {
  redirectUrl: string;
}

export const useNewPostDraft = (groupId: string) => {
  return useApiQuery<NewPostDraftResponse>(
    ['groupd', 'draft', groupId],
    `/api/groups/${groupId}/posts/new`,
    {
      enabled: false,
      retry: false,
    },
  );
};

/** 그룹 수정 시 새 draft 생성 */
export const useEditPostDraft = (groupId: string, postId: string) => {
  return useApiPost<NewPostDraftResponse>(
    `/api/groups/${groupId}/posts/${postId}/edit`,
  );
};
