import PostEditor from '@/app/(post)/_components/editor/RecordEditor';
import { groupDraftOptions } from '@/lib/api/groupRecord';
import { RecordBlock } from '@/lib/types/record';
import { ServerToFieldTypeMap } from '@/lib/utils/mapBlocksToPayload';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

interface AddPostPageProps {
  params: Promise<{
    groupId: string;
    draftId: string;
  }>;
  searchParams: Promise<{ mode?: string; postId?: string }>;
}

export default async function PostDraftPage({
  params,
  searchParams,
}: AddPostPageProps) {
  const { groupId, draftId } = await params;
  const { mode: queryMode, postId } = await searchParams;
  const mode = (queryMode as 'add' | 'edit') || 'add';

  const queryClient = new QueryClient();
  let initialPost = undefined;

  // 공동 작업인 경우 서버에서 프리패칭
  if (groupId && draftId) {
    try {
      const data = await queryClient.fetchQuery(
        groupDraftOptions(groupId, draftId),
      );

      const mappedBlocks = (data.snapshot.blocks || []).map(
        (block: RecordBlock) => ({
          ...block,
          type: ServerToFieldTypeMap[block.type] || block.type.toLowerCase(),
        }),
      ) as RecordBlock[];

      initialPost = {
        title: data.snapshot.title || '',
        blocks: mappedBlocks || [],
        version: data.version || 0,
      };
    } catch (error) {
      // Draft를 찾지 못한 경우 (이미 발행되었거나 삭제됨)
      const isNotFound =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        (error.message === 'Draft not found' ||
          String(error.message).includes('Draft not found'));

      if (isNotFound) {
        // Draft를 찾지 못한 경우
        // 발행 직후: DRAFT_PUBLISHED 이벤트로 클라이언트가 리다이렉트 처리
        // 실제로 없는 draft: 클라이언트에서 에러 처리 필요
        logger.error('Draft not found - client will handle', {
          draftId,
          groupId,
        });
        // initialPost: undefined로 렌더링
        // PostEditor에서 클라이언트 측 처리 필요
      } else {
        // 실제 에러인 경우에만 Sentry 전송
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            context: 'post-editor',
            operation: 'load-draft-blocks',
          },
          extra: {
            mode: mode,
            postId: postId,
            draftId: draftId,
            groupId: groupId,
          },
        });
        logger.error('공동 드래프트 로드 실패', error);
      }
    }
  }

  return (
    <PostEditor
      mode={mode}
      draftId={draftId}
      initialPost={initialPost}
      groupId={groupId}
      postId={postId}
    />
  );
}
