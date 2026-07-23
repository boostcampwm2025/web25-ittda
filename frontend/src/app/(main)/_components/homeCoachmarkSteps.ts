import type { CoachmarkStep } from '@/hooks/useCoachmark';

export const HOME_COACHMARK_STEPS: CoachmarkStep[] = [
  {
    id: 'tutorial-nav-my',
    title: '개인 기록과 그룹 기록을 나눠서 관리해요',
    description: '나만 보는 기록은 개인 기록함에, 함께 쓰는 기록은 그룹에 따로 쌓여요.',
    yOffsetMobile: 4,
    isBottomNavTarget: true,
  },
  {
    id: 'tutorial-fab-add-record',
    title: '여기서 기록을 남겨보세요',
    description: '사진과 함께 오늘의 순간을 기록해요.',
    yOffsetMobile: 6.2,
    isBottomNavTarget: true,
  },
  {
    id: 'tutorial-nav-group',
    title: '그룹으로 함께 기록해요',
    description: '친구를 초대해서 함께 추억을 쌓아보세요.',
    yOffsetMobile: 4,
    isBottomNavTarget: true,
  },
];
