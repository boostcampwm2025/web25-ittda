'use client';

import { recordDetailOptions } from '@/lib/api/records';
import { Block } from '@/lib/types/record';
import { useSuspenseQuery } from '@tanstack/react-query';
import RecordDetailHeaderActions from './RecordDetailHeaderActions';
import BlockContent from '@/components/BlockContent';
import { cn } from '@/lib/utils';

interface RecordDetailProps {
  recordId: string;
}

export default function RecordDetail({ recordId }: RecordDetailProps) {
  const { data: record } = useSuspenseQuery(
    recordDetailOptions('225f4bd7-3bbc-4a71-8747-fe6a43dc3d6c'),
  );

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
    <div className="-mt-6 min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-6 sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/90 bg-white/90">
        <RecordDetailHeaderActions record={record} />
      </header>

      <main className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {record.title}
        </h1>

        <div className="space-y-3">
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
                  className="grid grid-cols-2 gap-3 justify-between"
                >
                  {sortedBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={cn(
                        block.layout.col === 2 && 'flex justify-end',
                      )}
                    >
                      <BlockContent block={block} />
                    </div>
                  ))}
                </div>
              );
            }
          })}
        </div>

        <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
            작성자
          </h2>
          <div className="space-y-2">
            {record.contributors.map((contributor) => (
              <div
                key={contributor.userId}
                className="flex items-center gap-2 text-[13px]"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {contributor.nickname}
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
