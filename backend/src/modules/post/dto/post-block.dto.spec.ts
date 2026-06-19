import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { PostBlockType } from '@/enums/post-block-type.enum';

import { PostBlockDto } from './post-block.dto';

const createMoodBlock = (mood: string) =>
  plainToInstance(PostBlockDto, {
    type: PostBlockType.MOOD,
    value: { mood },
    layout: { row: 1, col: 1, span: 1 },
  });

describe('PostBlockDto mood validation', () => {
  it('accepts moods that exist in the frontend picker', () => {
    const anxiousBlock = createMoodBlock('불안');
    const depressedBlock = createMoodBlock('우울');

    expect(validateSync(anxiousBlock)).toHaveLength(0);
    expect(validateSync(depressedBlock)).toHaveLength(0);
  });

  it('rejects moods outside the allowed set', () => {
    const invalidBlock = createMoodBlock('설렘');
    const [error] = validateSync(invalidBlock);

    expect(error?.constraints?.MoodValueConstraint).toContain(
      'mood must be one of:',
    );
  });
});
