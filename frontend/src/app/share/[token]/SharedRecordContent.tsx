'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/api';
import BlockContent from '@/components/BlockContent';
import { Block, ImageValue } from '@/lib/types/record';
import { cn } from '@/lib/utils';
import { Loader2, Lock } from 'lucide-react';

interface SharedPostResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
  resolvedMediaUrls: Record<string, string>;
}

function injectResolvedUrls(
  blocks: Block[],
  resolvedMediaUrls: Record<string, string>,
): Block[] {
  return blocks.map((block) => {
    if (block.type !== 'IMAGE') return block;
    const imageValue = block.value as ImageValue;
    const resolvedUrls = (imageValue.mediaIds ?? [])
      .map((id) => resolvedMediaUrls[id])
      .filter(Boolean) as string[];
    return {
      ...block,
      value: { ...imageValue, resolvedUrls },
    };
  });
}

export default function SharedRecordContent() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shared-record', token],
    meta: { silent: true },
    queryFn: async () => {
      const res = await get<SharedPostResponse>(
        `/api/posts/shared/${token}`,
        undefined,
        { skipAuth: true },
      );
      if (!res.success || !res.data) throw new Error('Not found');
      return res.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-itta-point" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <Lock className="w-10 h-10 text-gray-300" />
        <p className="font-bold text-gray-600 dark:text-gray-300">
          공유된 기록을 찾을 수 없어요
        </p>
        <p className="text-xs text-gray-400">
          링크가 만료되었거나 공유가 해제된 기록이에요.
        </p>
      </div>
    );
  }

  const blocks = injectResolvedUrls(data.blocks, data.resolvedMediaUrls);

  const rowMap = new Map<number, Block[]>();
  blocks.forEach((block) => {
    const row = block.layout.row;
    if (!rowMap.has(row)) rowMap.set(row, []);
    rowMap.get(row)!.push(block);
  });
  const sortedRows = Array.from(rowMap.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="min-h-screen dark:bg-[#121212] bg-[#FDFDFD] px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {data.title}
        </h1>

        <div className="space-y-3">
          {sortedRows.map(([rowNumber, rowBlocks]) => {
            const sortedBlocks = rowBlocks.sort(
              (a, b) => a.layout.col - b.layout.col,
            );
            const hasFullWidth = sortedBlocks.some((b) => b.layout.span === 2);

            if (hasFullWidth) {
              return (
                <div key={rowNumber} className="w-full">
                  {sortedBlocks.map((block) => (
                    <div key={block.id}>
                      <BlockContent block={block} />
                    </div>
                  ))}
                </div>
              );
            }

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
          })}
        </div>
      </div>
    </div>
  );
}
