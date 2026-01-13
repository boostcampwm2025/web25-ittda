import { BadRequestException } from '@nestjs/common';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockDto } from '@/modules/post/dto/create-post.dto';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

type LocationValue = {
  lat: number;
  lng: number;
  address: string;
  placeName?: string;
};

type ExtractedMeta = {
  tags?: string[];
  rating?: number;
  location?: LocationValue;
  date: string; // required
  time: string; // required
};

type BlockWithType<T extends PostBlockType> = BlockDto & {
  type: T;
  value: BlockValueMap[T];
};

function isBlockType<T extends PostBlockType>(
  block: BlockDto,
  type: T,
): block is BlockWithType<T> {
  return block.type === type;
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length > 0);
  // 중복 제거 + 최대 10
  return Array.from(new Set(cleaned)).slice(0, 10);
}

export function extractMetaFromBlocks(blocks: BlockDto[]): ExtractedMeta {
  let date: string | undefined;
  let time: string | undefined;
  let location: LocationValue | undefined;
  let rating: number | undefined;
  let tags: string[] | undefined;

  for (const b of blocks) {
    if (isBlockType(b, PostBlockType.DATE)) {
      date = b.value.date;
      continue;
    }
    if (isBlockType(b, PostBlockType.TIME)) {
      time = b.value.time;
      continue;
    }
    if (isBlockType(b, PostBlockType.LOCATION)) {
      location = {
        lat: b.value.lat,
        lng: b.value.lng,
        address: b.value.address,
        placeName: b.value.placeName,
      };
      continue;
    }
    if (isBlockType(b, PostBlockType.RATING)) {
      rating = b.value.rating;
      continue;
    }
    if (isBlockType(b, PostBlockType.TAG)) {
      const nt = normalizeTags(b.value.tags);
      if (nt.length > 0) tags = nt;
      else tags = []; // TAG 블록이 있는데 비어있으면 빈 배열로 동기화할지 정책 결정
    }
  }

  // DATE/TIME은 validateBlocks에서 강제하지만, 방어적으로 한 번 더
  if (!date) throw new BadRequestException('DATE block is required');
  if (!time) throw new BadRequestException('TIME block is required');

  return { date, time, location, rating, tags };
}
