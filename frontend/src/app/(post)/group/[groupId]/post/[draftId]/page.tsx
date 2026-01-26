import PostEditor from '@/app/(post)/_components/editor/RecordEditor';
import { groupDraftOptions } from '@/lib/api/groupRecord';
import { RecordBlock } from '@/lib/types/record';
import { ServerToFieldTypeMap } from '@/lib/utils/mapBlocksToPayload';
import { QueryClient } from '@tanstack/react-query';

interface AddPostPageProps {
  params: Promise<{ groupId: string; draftId: string }>;
}

export default async function PostDraftPage({ params }: AddPostPageProps) {
  const { groupId, draftId } = await params;
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
      console.error('공동 드래프트 로드 실패:', error);
    }
  }

  return <PostEditor mode="add" draftId={draftId} initialPost={initialPost} />;
}
