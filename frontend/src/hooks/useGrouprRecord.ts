import { useApiPost } from './useApi';

interface NewPostDraftResponse {
  redirectUrl: string;
}

export const useNewPostDraft = (groupId: string) => {
  return useApiPost<NewPostDraftResponse>(`/api/groups/${groupId}/posts/new`);
};

/** 그룹 수정 시 새 draft 생성 */
export const useEditPostDraft = (groupId: string, postId: string) => {
  return useApiPost<NewPostDraftResponse>(
    `/api/groups/${groupId}/posts/${postId}/edit`,
  );
};
