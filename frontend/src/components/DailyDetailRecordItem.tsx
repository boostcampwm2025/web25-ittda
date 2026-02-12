'use client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import DailyDetailRecordActions from '../app/(post)/_components/DailyDetailRecordActions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RecordPreview } from '@/lib/types/recordResponse';
import { Block } from '@/lib/types/record';
import BlockContent from '@/components/BlockContent'; // BlockContent 컴포넌트 임포트 필요
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useApiDelete } from '@/hooks/useApi';
import { toast } from 'sonner';
import { ApiError } from '@/lib/utils/errorHandler';
import AssetImage from './AssetImage';
import { formatTime } from '@/lib/date';
import { refreshSharedData } from '@/lib/actions/revalidate';

interface DailyDetailRecordItemProps {
  record: RecordPreview;
  groupId?: string;
}

export default function DailyDetailRecordItem({
  record,
  groupId,
}: DailyDetailRecordItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();
  const { mutate: deleteRecord } = useApiDelete(`/api/posts/${record.postId}`, {
    onSuccess: async () => {
      toast.success('기록이 삭제되었습니다.');
      if (groupId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['group', groupId, 'records'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['shared'],
          }),
          refreshSharedData(),
        ]);
      } else {
        queryClient.invalidateQueries({
          queryKey: ['my', 'records'],
        });
      }
    },
    onError: (error: ApiError) => {
      if (error.code && error.code === 'NOT_FOUND') {
        router.back();
      }
    },
  });

  const handleDelete = () => {
    // 실제 삭제 로직
    deleteRecord({});
    setIsDeleteDialogOpen(false);
  };

  const handleRecordClick = (recordId: string) => {
    const path = groupId
      ? `/record/${recordId}?scope=group&groupId=${groupId}`
      : `/record/${recordId}`;
    router.push(path);
  };

  const time = record.eventAt ? formatTime(new Date(record.eventAt)) : '';

  return (
    <>
      <div className="space-y-2">
        {/* 상단 메타데이터: 시간 & 액션 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] sm:text-[13px] font-medium text-gray-600 dark:text-gray-300 uppercase">
              {time || '시간 정보 없음'}
            </span>
          </div>
          <div className="relative">
            <DailyDetailRecordActions
              record={record}
              onDeleteClick={() => setIsDeleteDialogOpen(true)}
            />
          </div>
        </div>

        {/* 메인 카드 영역 */}
        <div
          onClick={() => handleRecordClick(record.postId)}
          className="rounded-lg p-5 border shadow-sm cursor-pointer active:scale-[0.99] transition-all overflow-hidden dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100/60"
        >
          {/* 제목 & 멤버 아바타 */}
          <div className="w-full flex justify-between items-start gap-2 mb-4">
            <div className="min-w-0">
              <h4 className="text-[15px] font-bold truncate dark:text-gray-200 text-itta-black">
                {record.title}
              </h4>
              {record.hasActiveEditDraft && (
                <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  공동 수정 중...
                </p>
              )}
            </div>

            <div className="flex -space-x-2 shrink-0">
              {groupId &&
                record.contributors?.slice(0, 4).map((m) => (
                  <div
                    key={m.userId}
                    className="w-8 h-8 overflow-hidden rounded-full shadow-sm border-2 bg-white dark:border-[#121212] border-white"
                  >
                    {m.groupProfileImageId ? (
                      <AssetImage
                        width={32}
                        height={32}
                        className="w-full h-full object-cover rounded-full"
                        assetId={m.groupProfileImageId}
                        alt={`${m.groupNickname || m.nickname}의 프로필`}
                      />
                    ) : (
                      <Image
                        width={32}
                        height={32}
                        src={'/profile_base.png'}
                        alt={`${m.groupNickname || m.nickname}의 프로필`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    )}
                  </div>
                ))}
              {groupId &&
                record.contributors &&
                record.contributors.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-[#121212] border-white flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                      +{record.contributors.length - 4}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* 블록 레이아웃 렌더링 영역 */}
          <div className="space-y-3">
            {(() => {
              // 1. 블록을 row별로 그룹화 (RecordList 로직 이식)
              const rowMap = new Map<number, Block[]>();
              record.blocks.forEach((block) => {
                const row = block.layout.row;
                if (!rowMap.has(row)) rowMap.set(row, []);
                rowMap.get(row)!.push(block);
              });

              // 2. row 순서대로 정렬
              const sortedRows = Array.from(rowMap.entries()).sort(
                ([a], [b]) => a - b,
              );

              return sortedRows.map(([rowNumber, blocks]) => {
                const sortedBlocks = blocks.sort(
                  (a, b) => a.layout.col - b.layout.col,
                );

                const hasFullWidth = sortedBlocks.some(
                  (block) => block.layout.span === 2,
                );

                if (hasFullWidth) {
                  // Span 2인 경우: 전체 너비
                  return (
                    <div key={rowNumber} className="w-full">
                      {sortedBlocks.map((block) => (
                        <BlockContent
                          key={`${record.postId}-${block.id}`}
                          block={block}
                        />
                      ))}
                    </div>
                  );
                } else {
                  // Span 1인 경우: 양 끝에 붙는 Flex 레이아웃
                  return (
                    <div
                      key={rowNumber}
                      className="flex justify-between items-center gap-3 w-full overflow-hidden"
                    >
                      {sortedBlocks.map((block) => (
                        <div
                          key={block.id}
                          className={cn(
                            'min-w-0 shrink',
                            block.layout.col === 2 ? 'text-right' : 'text-left',
                          )}
                        >
                          <div className="truncate whitespace-nowrap overflow-hidden">
                            <BlockContent block={block} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              });
            })()}
          </div>
        </div>
      </div>

      {/* 삭제 확인 드로어 (기존 유지) */}
      <Drawer open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DrawerContent className="w-full px-8 pt-4 pb-10">
          <DrawerHeader className="flex flex-col items-center text-center space-y-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <DrawerTitle className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                {`'${record.title}'`}
                <br />
                기록을 삭제할까요?
              </DrawerTitle>
              <p className="text-sm text-gray-400 font-medium text-center">
                이 날의 소중한 추억이 사라집니다.
              </p>
            </div>
          </DrawerHeader>

          <div className="flex gap-4">
            <DrawerClose className="cursor-pointer flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
              취소
            </DrawerClose>
            <button
              onClick={handleDelete}
              className="flex-2 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
            >
              삭제하기
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
