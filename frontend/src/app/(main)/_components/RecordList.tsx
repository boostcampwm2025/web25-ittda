'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateISO } from '@/lib/date';
import { useQuery } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';
import BlockContent from '@/components/BlockContent';
import { Block } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { BookOpen, Plus, Users, User } from 'lucide-react';
import { RecordPreview } from '@/lib/types/recordResponse';

interface RecordListProps {
  initialPreviews: RecordPreview[];
}

export default function RecordList({ initialPreviews }: RecordListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 date 파라미터 읽기, 없으면 오늘 날짜
  const selectedDateStr = searchParams.get('date') || formatDateISO();

  const { data: records = [] } = useQuery({
    ...recordPreviewListOptions(selectedDateStr),
    initialData: initialPreviews,
  });

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
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="text-[16px] font-bold truncate dark:text-white text-itta-black">
                  {record.title}
                </h4>
                {record.scope === 'GROUP' ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                    <Users className="w-3 h-3" />
                    <span>그룹</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shrink-0">
                    <User className="w-3 h-3" />
                    <span>개인</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {(() => {
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
                          <BlockContent
                            key={`${block.id}-${rowNumber}-${block.layout.col}`}
                            block={block}
                            imageLayout="tile"
                          />
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
                            key={`${block.id}-${rowNumber}-${block.layout.col}`}
                            className={cn(
                              'min-w-0, shrink',
                              block.layout.col === 2
                                ? 'text-right'
                                : 'text-left',
                            )}
                          >
                            <div className="truncate whitespace-nowrap overflow-hidden">
                              <BlockContent block={block} imageLayout="tile" />
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
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-dashed dark:bg-white/5 dark:border-white/10 bg-white border-gray-200">
          <div className="w-14 h-14 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
            <BookOpen className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold dark:text-gray-200 text-gray-700">
              아직 기록이 없어요
            </p>
            <p className="text-xs text-gray-400">
              이날의 첫 번째 추억을 남겨보세요
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/add')}
            className="mt-2 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-itta-black shadow-lg shadow-itta-black/20 hover:bg-itta-black/80 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            기록 추가하기
          </button>
        </div>
      )}
    </div>
  );
}
