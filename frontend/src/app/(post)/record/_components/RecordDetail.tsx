'use client';

import { recordDetailOptions } from '@/lib/api/records';
import { Block } from '@/lib/types/record';
import { useSuspenseQuery } from '@tanstack/react-query';
import RecordDetailHeaderActions from './RecordDetailHeaderActions';
import BlockContent from '@/components/BlockContent';
import { cn } from '@/lib/utils';
import AssetImage from '@/components/AssetImage';

interface RecordDetailProps {
  recordId: string;
}

export default function RecordDetail({ recordId }: RecordDetailProps) {
  const { data: record } = useSuspenseQuery(recordDetailOptions(recordId));

  // 블록을 row별로 그룹화
  const rowMap = new Map<number, Block[]>();
  record.blocks.forEach((block) => {
    const row = block.layout.row;
    if (!rowMap.has(row)) {
      rowMap.set(row, []);
    }
    rowMap.get(row)!.push(block);
  });

  // row 순서대로 정렬
  const sortedRows = Array.from(rowMap.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="flex flex-col flex-1 -mt-6 transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-4 sm:-mx-6 sticky top-0 z-50 backdrop-blur-md px-2 sm:px-4 py-2 sm:p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/90 bg-white/90">
        <RecordDetailHeaderActions record={record} />
      </header>

      <main className="grow flex flex-col max-w-4xl mx-auto w-full">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {record.title}
          </h1>
          {record.hasActiveEditDraft && (
            <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
              공동 수정 중...
            </p>
          )}
        </div>

        <div className="grow space-y-3">
          {sortedRows.map(([rowNumber, blocks]) => {
            // 각 row의 블록을 col 순서대로 정렬
            const sortedBlocks = blocks.sort(
              (a, b) => a.layout.col - b.layout.col,
            );

            // span이 2인 블록이 있는지 확인
            const hasFullWidth = sortedBlocks.some(
              (block) => block.layout.span === 2,
            );

            if (hasFullWidth) {
              // span이 2인 경우: 전체 너비 사용
              return (
                <div key={rowNumber} className="w-full">
                  {sortedBlocks.map((block) => (
                    <div key={block.id}>
                      <BlockContent block={block} />
                    </div>
                  ))}
                </div>
              );
            } else {
              // span이 1인 경우: 2열 그리드로
              return (
                <div
                  key={rowNumber}
                  className="flex justify-between items-center gap-3 w-full overflow-hidden"
                >
                  {sortedBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={cn(
                        'min-w-0, shrink',
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
          })}
        </div>

        <div className="pt-6 sm:pt-8 mt-12 sm:mt-16 border-t border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            작성자
          </h2>
          <div className="space-y-2">
            {record.contributors.map((contributor) => (
              <div
                key={contributor.userId}
                className="flex items-center gap-2 text-xs sm:text-[13px]"
              >
                <div className="w-7.5 h-7.5 overflow-hidden rounded-full shadow-sm border-2 bg-white dark:border-[#121212] border-white">
                  <AssetImage
                    width={30}
                    height={30}
                    className="w-full h-full object-cover rounded-full"
                    assetId={
                      contributor.groupProfileImageId || '/profile_base.png'
                    }
                    alt={`${contributor.groupNickname || contributor.nickname}의 프로필`}
                  />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {contributor.groupNickname ||
                    contributor.nickname ||
                    'anonymous'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  {contributor.role === 'AUTHOR' ? '작성자' : '편집자'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
