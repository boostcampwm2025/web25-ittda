import { FieldType } from '../types/record';

export const FIELD_META: Record<
  FieldType,
  {
    label: string;
    isSingle: boolean; // 한 블록만 존재 가능한가?(한 번에 여러개가 보여지는 경우 포함)
    requiresDrawer: boolean; // 입력을 위해 드로어가 필요한지
  }
> = {
  emotion: { label: '감정', isSingle: false, requiresDrawer: true },
  photos: { label: '사진', isSingle: true, requiresDrawer: true }, // 사진 블록 자체는 하나
  location: { label: '위치', isSingle: true, requiresDrawer: false },
  rating: { label: '별점', isSingle: true, requiresDrawer: true },
  content: { label: '텍스트', isSingle: false, requiresDrawer: false },
  tags: { label: '태그', isSingle: true, requiresDrawer: true },
  table: { label: '표', isSingle: false, requiresDrawer: false },
  date: { label: '날짜', isSingle: true, requiresDrawer: true },
  time: { label: '시간', isSingle: true, requiresDrawer: true },
  media: { label: '미디어', isSingle: false, requiresDrawer: true },
};

export const MULTI_INSTANCE_LIMITS: Partial<Record<FieldType, number>> = {
  emotion: 4,
  content: 4,
  table: 4,
  media: 4,
  photos: 10,
};
