'use client';

import DiaryPostDetail from '@/components/DiaryPostDetail';
import DiaryPostShort from '@/components/DiaryPostShort';
import type { PostListItem } from '@/lib/types/post';

interface ListPanelProps {
  posts: PostListItem[];
  onStartDrag: () => void;
  selectedPostId: string | null;
  onSelectPost: (id: string | null) => void;
}

export default function ListPanel({
  posts,
  selectedPostId,
  onSelectPost,
  onStartDrag,
}: ListPanelProps) {

  return (
    <div className="flex-col h-full w-full relative overflow-hidden">
      {/* 리스트 뷰 */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ${
          selectedPostId !== null ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full w-full overflow-y-auto">
          <div className="relative flex-1">
            {posts.map((post) => (
              <DiaryPostShort key={post.id} post={post} onClick={() => onSelectPost(post.id)} />
            ))}
            <div className="absolute left-3.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 상세 뷰 */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ${
          selectedPostId !== null ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full w-full overflow-y-auto bg-white">
          {selectedPostId !== null && (
            <DiaryPostDetail
              postId={selectedPostId}
              onBack={() => onSelectPost(null)}
            />
          )}
        </div>
      </div>

      {/* 드래그 핸들 */}
      <div
        className="absolute right-0 w-2 h-16 bg-itta-black rounded-tl-md rounded-bl-md top-[50%] -translate-y-1/2 cursor-col-resize z-50"
        onMouseDown={(e) => {
          e.preventDefault();
          onStartDrag();
        }}
      />
    </div>
  );
}
