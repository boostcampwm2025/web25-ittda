import { BadRequestException } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PostBlockDto } from '../dto/post-block.dto';
import { PostBlockType } from '@/enums/post-block-type.enum';

export function validateBlockValues(blocks: PostBlockDto[]) {
  for (const block of blocks) {
    switch (block.type) {
      case PostBlockType.DATE: {
        const date = (block.value as { date?: unknown } | undefined)?.date;
        if (typeof date !== 'string' || date.trim().length === 0) {
          throw new BadRequestException('DATE.value.date is required.');
        }
        break;
      }
      case PostBlockType.TIME: {
        const time = (block.value as { time?: unknown } | undefined)?.time;
        if (typeof time !== 'string' || time.trim().length === 0) {
          throw new BadRequestException('TIME.value.time is required.');
        }
        break;
      }
      case PostBlockType.TEXT: {
        const text = (block.value as { text?: unknown } | undefined)?.text;
        if (typeof text !== 'string' || text.trim().length === 0) {
          throw new BadRequestException('TEXT.value.text is required.');
        }
        break;
      }
      case PostBlockType.TAG: {
        const tags = (block.value as { tags?: unknown } | undefined)?.tags;
        if (!Array.isArray(tags)) {
          throw new BadRequestException('TAG.value.tags must be an array.');
        }
        const cleaned = tags
          .filter((t) => typeof t === 'string')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        if (cleaned.length === 0) {
          throw new BadRequestException('TAG.value.tags must not be empty.');
        }
        break;
      }
      case PostBlockType.IMAGE: {
        const mediaIds = (block.value as { mediaIds?: unknown } | undefined)
          ?.mediaIds;
        if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
          throw new BadRequestException('IMAGE.mediaIds must not be empty.');
        }
        break;
      }
      case PostBlockType.TABLE: {
        const value = block.value as
          | { rows?: unknown; cols?: unknown; cells?: unknown }
          | undefined;
        const rows = value?.rows;
        const cols = value?.cols;
        if (
          typeof rows !== 'number' ||
          typeof cols !== 'number' ||
          rows < 1 ||
          cols < 1
        ) {
          throw new BadRequestException('TABLE.rows/cols must be >= 1.');
        }
        if (!Array.isArray(value?.cells)) {
          throw new BadRequestException('TABLE.cells must be a 2D array.');
        }
        const cells = value?.cells as unknown[];
        if (cells.length !== rows) {
          throw new BadRequestException('TABLE.cells row count mismatch.');
        }
        let hasNonEmptyCell = false;
        for (const row of cells) {
          if (!Array.isArray(row) || row.length !== cols) {
            throw new BadRequestException('TABLE.cells col count mismatch.');
          }
          for (const cell of row) {
            if (typeof cell !== 'string') {
              throw new BadRequestException('TABLE.cells must be strings.');
            }
            if (cell.trim().length > 0) {
              hasNonEmptyCell = true;
            }
          }
        }
        if (!hasNonEmptyCell) {
          throw new BadRequestException('TABLE.cells must not be empty.');
        }
        break;
      }
      default:
        break;
    }
    const candidate = plainToInstance(PostBlockDto, block);
    const errors = validateSync(candidate, { forbidUnknownValues: false });
    if (errors.length === 0) continue;
    const message =
      errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .find((value) => value.length > 0) ?? 'block value is invalid.';
    throw new BadRequestException(message);
  }
}
