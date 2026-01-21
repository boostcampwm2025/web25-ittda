import PostEditor from '../_components/editor/RecordEditor';
import { groupDraftOptions } from '@/lib/api/groupRecord';
import { QueryClient } from '@tanstack/react-query';

interface AddPostPageProps {
  searchParams: Promise<{
    groupId?: string;
    draftId?: string;
  }>;
}

export default async function AddPostPage({ searchParams }: AddPostPageProps) {
  const { groupId, draftId } = await searchParams;
  const queryClient = new QueryClient();
  let initialPost = undefined;

  // 공동 작업인 경우 서버에서 프리패칭
  if (groupId && draftId) {
    try {
      const data = await queryClient.fetchQuery(
        groupDraftOptions(groupId, draftId),
      );

      initialPost = {
        title: data.snapshot.title || '',
        blocks: data.snapshot.blocks || [],
      };
    } catch (error) {
      console.error('공동 드래프트 로드 실패:', error);
    }
  }

  return (
    <PostEditor
      mode="add"
      // groupId={groupId}
      // draftId={draftId}
      initialPost={initialPost}
    />
  );
}
