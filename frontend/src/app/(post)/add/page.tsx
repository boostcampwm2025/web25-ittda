import { personalEditOptions } from '@/lib/api/records';
import PostEditor from '../_components/editor/RecordEditor';
import { QueryClient } from '@tanstack/react-query';
import { RecordBlock } from '@/lib/types/record';
import { ServerToFieldTypeMap } from '@/lib/utils/mapBlocksToPayload';

interface AddPostPageProps {
  searchParams: Promise<{ mode: string; postId: string }>;
}

export default async function AddPostPage({ searchParams }: AddPostPageProps) {
  const { mode: queryMode, postId } = await searchParams;
  const queryClient = new QueryClient();
  let initialPost = undefined;

  const mode = (queryMode as 'add' | 'edit') || 'add';

  try {
    if (mode === 'edit' && postId) {
      const data = await queryClient.fetchQuery(personalEditOptions(postId));

      const mappedBlocks = (data.blocks || []).map((block: RecordBlock) => ({
        ...block,
        type: ServerToFieldTypeMap[block.type] || block.type.toLowerCase(),
      })) as RecordBlock[];

      initialPost = {
        title: data.title || '',
        blocks: mappedBlocks,
      };
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error);
  }

  return <PostEditor mode={mode} initialPost={initialPost} />;
}
