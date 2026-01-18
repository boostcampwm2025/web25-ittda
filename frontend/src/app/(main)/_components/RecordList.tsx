'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateISO } from '@/lib/date';
import { useQuery } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';
import BlockContent from '@/components/BlockContent';
import { Block } from '@/lib/types/record';
import { cn } from '@/lib/utils';

export default function RecordList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 date 파라미터 읽기, 없으면 오늘 날짜
  const selectedDateStr = searchParams.get('date') || formatDateISO();

  const { data: records = [] } = useQuery(
    recordPreviewListOptions(selectedDateStr),
  );

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[14px] font-bold dark:text-white text-itta-black">
          {selectedDateStr === formatDateISO()
            ? '오늘의 기록'
            : `${selectedDateStr.split('-')[2]}일의 기록`}
        </h3>
        <span className="text-[11px] text-[#10B981] font-bold">
          총 {records.length}개
        </span>
      </div>

      {records.length > 0 ? (
        records.map((record) => (
          <div
            key={record.postId}
            onClick={() => router.push(`/record/${record.postId}`)}
            className="rounded-2xl p-6 shadow-sm border active:scale-[0.98] transition-all cursor-pointer overflow-hidden dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[16px] font-bold truncate dark:text-white text-itta-black">
                {record.title}
              </h4>
            </div>
            <div className="space-y-3">
              {(() => {
                // 블록을 row별로 그룹화
                const rowMap = new Map<number, Block[]>();
                record.block.forEach((block) => {
                  const row = block.layout.row;
                  if (!rowMap.has(row)) {
                    rowMap.set(row, []);
                  }
                  rowMap.get(row)!.push(block);
                });

                // row 순서대로 정렬
                const sortedRows = Array.from(rowMap.entries()).sort(
                  ([a], [b]) => a - b,
                );

                return sortedRows.map(([rowNumber, blocks]) => {
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
                          <BlockContent key={block.id} block={block} />
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
                              block.layout.col === 2
                                ? 'text-right'
                                : 'text-left',
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
        ))
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            이날의 기록이 없습니다.
          </p>
          <button
            type="button"
            onClick={() => {
              const formattedDate = selectedDateStr.replace(/-/g, '.');
              router.push(`/add?prefilledDate=${formattedDate}`);
            }}
            className="text-[11px] font-bold text-[#10B981] hover:underline"
          >
            기록 추가하기
          </button>
        </div>
      )}
    </div>
  );
}
