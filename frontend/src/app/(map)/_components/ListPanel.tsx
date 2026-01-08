// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import DiaryPostDetail from '@/components/DiaryPostDetail';
// import DiaryPostShort from '@/components/DiaryPostShort';
// import type { PostListItem } from '@/lib/types/record';

// interface ListPanelProps {
//   posts: PostListItem[];
//   onStartDrag: () => void;
//   selectedPostId: string | null;
//   onSelectPost: (id: string | null) => void;
//   isMobile: boolean;
// }

// export default function ListPanel({
//   posts,
//   selectedPostId,
//   onSelectPost,
//   onStartDrag,
//   isMobile,
// }: ListPanelProps) {
//   const [isDetailOpen, setIsDetailOpen] = useState(false);
//   const listRef = useRef<HTMLDivElement | null>(null);
//   const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;

//   // 선택된 게시글이 바뀌면 리스트에서 해당 항목으로 스크롤
//   useEffect(() => {
//     if (!selectedPostId || !listRef.current) return;

//     const el = listRef.current.querySelector<HTMLDivElement>(
//       `[data-post-id="${selectedPostId}"]`,
//     );
//     el?.scrollIntoView({ block: 'start' });
//   }, [selectedPostId]);

//   return (
//     <div className="flex flex-col h-full w-full relative overflow-hidden">
//       {/* 모바일 - 상단 드래그 핸들 영역 */}
//       {isMobile && (
//         <div
//           className="w-full flex justify-center py-3 cursor-row-resize active:bg-gray-50 transition-colors"
//           onMouseDown={onStartDrag}
//           onTouchStart={onStartDrag}
//         >
//           <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
//         </div>
//       )}
//       {/* 리스트 뷰 */}
//       <div className="relative flex-1 overflow-hidden">
//         <div
//           className={`absolute inset-0 transition-transform duration-300 ${
//             isDetailOpen ? '-translate-x-full' : 'translate-x-0'
//           }`}
//         >
//           <div
//             className="flex flex-col h-full w-full overflow-y-auto"
//             ref={listRef}
//           >
//             <div className="relative flex-1">
//               {posts.map((post) => (
//                 <div key={post.id} data-post-id={post.id}>
//                   <DiaryPostShort
//                     post={post}
//                     active={selectedPostId === post.id}
//                     onClick={() => {
//                       onSelectPost(post.id);
//                       setIsDetailOpen(true);
//                     }}
//                   />
//                 </div>
//               ))}
//               <div className="absolute left-3.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
//             </div>
//           </div>
//         </div>

//         {/* 상세 뷰 */}
//         <div
//           className={`absolute inset-0 transition-transform duration-300 ${
//             isDetailOpen ? 'translate-x-0' : 'translate-x-full'
//           }`}
//         >
//           <div className="flex flex-col h-full w-full overflow-y-auto bg-white">
//             {selectedPost && (
//               <DiaryPostDetail
//                 post={selectedPost}
//                 onBack={() => {
//                   onSelectPost(null);
//                   setIsDetailOpen(false);
//                 }}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* 웹 - 드래그 핸들 */}
//       {!isMobile && (
//         <div
//           className="absolute right-0 w-2 h-16 bg-itta-black rounded-tl-md rounded-bl-md top-[50%] -translate-y-1/2 cursor-col-resize z-50"
//           onMouseDown={(e) => {
//             e.preventDefault();
//             onStartDrag();
//           }}
//         />
//       )}
//     </div>
//   );
// }
