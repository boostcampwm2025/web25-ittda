import type { CoachmarkStep } from '@/hooks/useCoachmark';

export const GROUP_DETAIL_COACHMARK_STEPS: CoachmarkStep[] = [
  {
    id: 'tutorial-group-invite',
    title: '친구를 초대해보세요',
    description: '초대 링크로 그룹원을 초대해서 함께 기록해요.',
  },
  {
    id: 'tutorial-group-tabs',
    title: '피드와 보관함을 오가며 봐요',
    description: '최신 기록은 피드에서, 모아보기는 보관함에서 확인해요.',
  },
  {
    id: 'tutorial-group-drafts',
    title: '지금 누가 쓰고 있는지 확인해요',
    description:
      '그룹원들이 실시간으로 공동 작성 중인 기록을 여기서 볼 수 있어요.',
    xOffsetMobile: 3.2,
  },
  {
    id: 'tutorial-group-add-record',
    title: '이 그룹에 기록을 남겨보세요',
    description: '사진과 함께 그룹원들과의 순간을 기록해요.',
    yOffsetMobile: 6.2,
  },
  {
    id: 'tutorial-group-map',
    title: '지도에서 한눈에 확인해요',
    description: '그룹의 기록들이 남긴 장소를 지도로 둘러보세요.',
    yOffsetMobile: 4,
  },
];
