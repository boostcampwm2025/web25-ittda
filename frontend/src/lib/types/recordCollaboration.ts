import { BlockLayout, BlockValue, RecordBlock } from './record';

export type PatchApplyPayload =
  | {
      type: 'BLOCK_INSERT';
      block: RecordBlock;
    }
  | {
      type: 'BLOCK_DELETE';
      blockId: string;
    }
  | {
      type: 'BLOCK_MOVE';
      blockId: string;
      layout: BlockLayout;
    }
  | {
      type: 'BLOCK_SET_VALUE';
      blockId: string;
      value: BlockValue;
    }
  | {
      type: 'BLOCK_SET_TITLE';
      title: string;
    };
