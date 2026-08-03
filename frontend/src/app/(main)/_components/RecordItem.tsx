'use client';

import BlockContent from '@/components/BlockContent';
import { Block } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { Users, User } from 'lucide-react';
import { memo, useMemo } from 'react';
import { RecordPreview } from '@/lib/types/recordResponse';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';

type ImageLayout = 'carousel' | 'tile' | 'responsive';

interface RecordItemProps {
  record: RecordPreview;
  imageLayout: ImageLayout;
  isFirst?: boolean;
  onClick: () => void;
}

// 개인/그룹 홈 타임라인, 회상 피드 등에서 공통으로 쓰는 기록 카드.
const RecordItem = memo(function RecordItem({
  record,
  imageLayout,
  isFirst,
  onClick,
}: RecordItemProps) {
  const sortedRows = useMemo(() => {
    const rowMap = new Map<number, Block[]>();
    record.blocks.forEach((block) => {
      const row = block.layout.row;
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row)!.push(block);
    });

    // row 순서대로 정렬하고, 각 row의 블록도 col 순서대로 미리 정렬
    return Array.from(rowMap.entries())
      .sort(([a], [b]) => a - b)
      .map(
        ([rowNumber, blocks]) =>
          [
            rowNumber,
            blocks.sort((a, b) => a.layout.col - b.layout.col),
          ] as const,
      );
  }, [record.blocks]);

  return (
    <div
      onClick={onClick}
      className="rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border active:scale-[0.98] transition-all cursor-pointer overflow-hidden dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100"
    >
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h4 className="text-[14px] sm:text-[16px] font-bold truncate dark:text-white text-itta-black">
              {record.title}
            </h4>
            {record.scope === 'GROUP' ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>그룹</span>
                </div>

                {/* 그룹명 전용 뱃지 (동그란 점 포함) */}
                {record.groupName && (
                  <div className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    <span className="truncate max-w-15 sm:max-w-17.5 inline-block align-bottom">
                      {record.groupName}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>개인</span>
              </div>
            )}
          </div>
          {record.hasActiveEditDraft && (
            <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-gray-400 dark:text-gray-500">
              공동 수정 중...
            </p>
          )}
        </div>

        <div className="flex -space-x-2 shrink-0">
          {record.groupId &&
            record.contributors.slice(0, 4).map((m) => (
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
                    wrapperClassName="w-full h-full"
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
          {record.groupId && record.contributors.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-[#121212] border-white flex items-center justify-center">
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                +{record.contributors.length - 4}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {sortedRows.map(([rowNumber, blocks]) => {
          // 블록은 이미 정렬된 상태 (useMemo에서 처리)
          const hasFullWidth = blocks.some((block) => block.layout.span === 2);

          if (hasFullWidth) {
            // span이 2인 경우: 전체 너비 사용
            return (
              <div key={rowNumber} className="w-full">
                {blocks.map((block) => (
                  <BlockContent
                    key={`${block.id}-${rowNumber}-${block.layout.col}`}
                    block={block}
                    imageLayout={imageLayout}
                    priorityImage={isFirst}
                  />
                ))}
              </div>
            );
          } else {
            // span이 1인 경우: 2열 그리드로
            return (
              <div
                key={rowNumber}
                className="flex justify-between items-center gap-2 sm:gap-3 w-full overflow-hidden"
              >
                {blocks.map((block) => (
                  <div
                    key={`${block.id}-${rowNumber}-${block.layout.col}`}
                    className={cn(
                      'min-w-0, shrink',
                      block.layout.col === 2 ? 'text-right' : 'text-left',
                    )}
                  >
                    <div className="truncate whitespace-nowrap overflow-hidden">
                      <BlockContent
                        block={block}
                        imageLayout={imageLayout}
                        priorityImage={isFirst}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
});

export default RecordItem;
