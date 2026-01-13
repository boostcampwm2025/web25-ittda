import { FieldType } from '../types/record';

export const FIELD_META: Record<
  FieldType,
  {
    isSingle: boolean; // 한 블록만 존재 가능한가?(한 번에 여러개가 보여지는 경우 포함)
    requiresDrawer: boolean; // 입력을 위해 드로어가 필요한지
  }
> = {
  date: { isSingle: true, requiresDrawer: true },
  time: { isSingle: true, requiresDrawer: true },
  rating: { isSingle: true, requiresDrawer: true },
  location: { isSingle: true, requiresDrawer: true },
  tags: { isSingle: true, requiresDrawer: true },
  photos: { isSingle: true, requiresDrawer: true },
  media: { isSingle: true, requiresDrawer: true },
  emotion: { isSingle: false, requiresDrawer: true },
  content: { isSingle: false, requiresDrawer: false },
  table: { isSingle: false, requiresDrawer: false },
};
