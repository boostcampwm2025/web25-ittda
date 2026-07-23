import type { CoachmarkStep } from '@/hooks/useCoachmark';

export const RECORD_EDITOR_COACHMARK_STEPS: CoachmarkStep[] = [
  {
    id: 'tutorial-editor-toolbar',
    title: '나만의 스타일로 기록을 꾸며보세요',
    description: '평점, 감정, 표 등을 추가해서 개성 있는 기록을 만들어요.',
    xOffsetMobile: 7,
  },
  {
    id: 'tutorial-editor-location',
    title: '위치도 등록해보세요',
    description: '위치를 등록하면 지도 페이지에서 모아볼 수 있어요.',
    spotlightPadding: 1.5,
    yOffsetMobile: 1,
  },
  {
    id: 'tutorial-editor-drag-blocks',
    title: '블록을 자유롭게 옮겨보세요',
    description: '블록을 꾹 눌러 드래그하면 순서를 원하는 대로 바꿀 수 있어요.',
  },
];
