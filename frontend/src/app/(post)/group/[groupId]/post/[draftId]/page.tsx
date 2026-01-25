import PostEditor from '@/app/(post)/_components/editor/RecordEditor';
// import { groupDraftOptions } from '@/lib/api/groupRecord';
// import { QueryClient } from '@tanstack/react-query';

interface AddPostPageProps {
  params: Promise<{ groupId: string; draftId: string }>;
}

export default async function PostDraftPage({ params }: AddPostPageProps) {
  const { groupId, draftId } = await params;
  // TODO: 프리패칭 에러 해결 후 반영 예정
  // const queryClient = new QueryClient();
  const initialPost = undefined;

  // // 공동 작업인 경우 서버에서 프리패칭
  // if (groupId && draftId) {
  //   try {
  //     const data = await queryClient.fetchQuery(
  //       groupDraftOptions(groupId, draftId),
  //     );

  //     initialPost = {
  //       title: data.snapshot.title || '',
  //       blocks: data.snapshot.blocks || [],
  //     };
  //   } catch (error) {
  //     console.error('공동 드래프트 로드 실패:', error);
  //   }
  // }

  return (
    <PostEditor
      mode="add"
      groupId={groupId}
      draftId={draftId}
      initialPost={initialPost}
    />
  );
}
