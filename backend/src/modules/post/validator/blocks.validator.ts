import { BadRequestException } from '@nestjs/common';
import { PostBlockType } from '@/enums/post-block-type.enum';

type ValidateBlocksOptions = {
  requireDateTimeBlocks?: boolean; // default true
  enforceSingleMetaBlocks?: boolean; // default true
};

type Layout = { row: number; col: number; span: number };
type BlockDto = {
  type: PostBlockType;
  value: Record<string, any>;
  layout: Layout;
};

const MAX_COL = 2;
const MIN_ROW = 1;
const MIN_COL = 1;
const MAX_SPAN = 2;
const MIN_SPAN = 1;

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function occupiedCells(layout: Layout): Array<[number, number]> {
  const { row, col, span } = layout;
  const cells: Array<[number, number]> = [];
  for (let c = col; c < col + span; c++) {
    cells.push([row, c]);
  }
  return cells;
}

function buildCounts(blocks: BlockDto[]) {
  const counts = new Map<PostBlockType, number>();
  for (const b of blocks) counts.set(b.type, (counts.get(b.type) ?? 0) + 1);
  return counts;
}

function validateRequiredBlocks(counts: Map<PostBlockType, number>) {
  if ((counts.get(PostBlockType.DATE) ?? 0) !== 1) {
    throw new BadRequestException(`DATE block must exist exactly once`);
  }
  if ((counts.get(PostBlockType.TIME) ?? 0) !== 1) {
    throw new BadRequestException(`TIME block must exist exactly once`);
  }
  if ((counts.get(PostBlockType.TEXT) ?? 0) < 1) {
    throw new BadRequestException(`TEXT block must exist at least once`);
  }
}

function validateSingleMetaBlocks(counts: Map<PostBlockType, number>) {
  const singles: PostBlockType[] = [
    PostBlockType.LOCATION,
    PostBlockType.TAG,
    PostBlockType.RATING,
  ];
  for (const t of singles) {
    if ((counts.get(t) ?? 0) > 1) {
      throw new BadRequestException(`${t} block must be at most one`);
    }
  }
}

function validateLayout(blocks: BlockDto[]) {
  // 레이아웃 점유 셀 충돌 검사 준비
  const used = new Map<string, number>(); // cellKey -> blockIndex

  blocks.forEach((b, idx) => {
    if (!b.layout)
      throw new BadRequestException(`blocks[${idx}].layout is required`);

    const { row, col, span } = b.layout;

    if (!Number.isInteger(row) || row < MIN_ROW) {
      throw new BadRequestException(
        `blocks[${idx}].layout.row must be integer >= ${MIN_ROW}`,
      );
    }
    if (!Number.isInteger(col) || col < MIN_COL || col > MAX_COL) {
      throw new BadRequestException(
        `blocks[${idx}].layout.col must be 1..${MAX_COL}`,
      );
    }
    if (!Number.isInteger(span) || span < MIN_SPAN || span > MAX_SPAN) {
      throw new BadRequestException(
        `blocks[${idx}].layout.span must be 1..${MAX_SPAN}`,
      );
    }

    // 2열 고정일 때 span=2면 col=1만 가능
    if (span === 2 && col !== 1) {
      throw new BadRequestException(
        `blocks[${idx}] span=2 requires col=1 in 2-column layout`,
      );
    }

    // 점유 셀 충돌 검사 (span 고려)
    const cells = occupiedCells(b.layout);
    for (const [r, c] of cells) {
      if (c > MAX_COL) {
        throw new BadRequestException(
          `blocks[${idx}] layout exceeds column limit: row=${r}, col=${c}`,
        );
      }

      const key = cellKey(r, c);
      if (used.has(key)) {
        const prev = used.get(key)!;
        throw new BadRequestException(
          `layout conflict at (${r},${c}): blocks[${prev}] and blocks[${idx}] overlap`,
        );
      }
      used.set(key, idx);
    }
  });
}

/**
 * - layout 범위 검증
 * - span=2일 때 col=2 금지 (2열 고정)
 * - 점유 셀 충돌 검사 (span 고려)
 * - (선택) 타입별 개수 제한은 여기서도 가능하지만 v1은 서비스에서 따로 해도 됨
 */
export function validateBlocks(
  blocks?: BlockDto[],
  options: ValidateBlocksOptions = {},
) {
  // DATE/TIME 필수 여부와 메타 블록 중복 제한 등 기본 규칙을 검사
  const { requireDateTimeBlocks = true, enforceSingleMetaBlocks = true } =
    options;

  if (!blocks || blocks.length === 0) {
    if (requireDateTimeBlocks) {
      throw new BadRequestException(`blocks are required: missing DATE, TIME`);
    }
    return;
  }

  const counts = buildCounts(blocks);

  if (requireDateTimeBlocks) {
    validateRequiredBlocks(counts);
  }

  if (enforceSingleMetaBlocks) {
    validateSingleMetaBlocks(counts);
  }

  validateLayout(blocks);
}
