import { post } from '@/lib/api/api';
import {
  MultiResolveResponse,
  MultiResolveItem,
} from '@/hooks/useMediaResolve';
import { Block, ImageValue } from '../types/record';

interface ImageBlock extends Block {
  type: 'IMAGE';
  value: ImageValue;
}

/**
 * 블록이 이미지 블록인지 확인
 */
function isImageBlock(block: Block): block is ImageBlock {
  return block.type === 'IMAGE';
}

/**
 * 블록 배열 내의 이미지 블록들을 찾아서
 * 서버로부터 실제 접근 가능한 URL을 받아와 주입
 */
export async function resolveMediaInBlocks(blocks: Block[]): Promise<Block[]> {
  const imageBlocks = blocks.filter(isImageBlock);

  // 모든 mediaId 수집
  const allMediaIds = Array.from(
    new Set(imageBlocks.flatMap((b) => b.value.mediaIds || [])),
  );

  // Resolve할 ID 없으면 원본
  if (allMediaIds.length === 0) return blocks;

  try {
    const response = await post<MultiResolveResponse>('/api/media/resolve', {
      mediaIds: allMediaIds,
    });

    if (!response.success) return blocks;

    const urlMap = new Map(
      response.data.items.map((item: MultiResolveItem) => [
        item.mediaId,
        item.url,
      ]),
    );

    // URL이 주입된 새로운 블록 배열 생성
    return blocks.map((block) => {
      if (isImageBlock(block)) {
        const mediaIds = block.value.mediaIds || [];
        const resolvedUrls = mediaIds
          .map((id: string) => urlMap.get(id))
          .filter(Boolean) as string[];

        return {
          ...block,
          value: {
            ...block.value,
            resolvedUrls,
          },
        };
      }
      return block;
    });
  } catch (error) {
    console.error('Media Resolve Error:', error);
    return blocks; // 실패 시 원본
  }
}
