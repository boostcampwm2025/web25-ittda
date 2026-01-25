import { queryOptions } from '@tanstack/react-query';
import { get } from './api';
import { createApiError } from '../utils/errorHandler';
import { RecordBlock } from '../types/record';

export interface GroupDraftResponse {
  snapshot: {
    scope: string;
    title: string;
    blocks: RecordBlock[];
    groupId: string;
  };
  version: number;
  ownerActorId: string;
}

export const groupDraftOptions = (groupId: string, draftId: string) =>
  queryOptions({
    queryKey: ['group', 'draft', groupId, draftId],
    queryFn: async () => {
      const response = await get<GroupDraftResponse>(
        `/api/groups/${groupId}/drafts/${draftId}`,
      );

      if (!response.success) {
        throw createApiError(response);
      }
      return response.data;
    },
    retry: false,
    enabled: !!groupId && !!draftId,
  });
