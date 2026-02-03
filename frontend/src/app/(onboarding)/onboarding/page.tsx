'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

const ONBOARDING_DATA = [
  {
    title: '사진 한 장만 올리세요,\n기록은 저희가 할게요',
    description:
      '이미지 속 날짜, 시간, 장소를 자동으로 불러와 채워드려요.\n이제 일일이 기억해낼 필요 없이, 추억에만 집중하세요.',
    visual: () => {}, //<VisualOne />, // 각 페이지별 애니메이션 컴포넌트
  },
  {
    title: '취향대로 만드는\n커스텀 기록지',
    description:
      '평점, 감정, 표, 미디어 등 원하는 필드를 자유롭게 배치해 보세요.\n맛집 탐방부터 영화 리뷰까지, 모든 순간이 나만의 스타일로 보관돼요.',
    visual: () => {}, //<VisualTwo />,
  },
  {
    title: '따로 또 같이,\n우리만의 집단적 기억',
    description:
      '친구와 함께 여행 기록을 편집해 보세요.\n각자의 시선이 모여 하나의 입체적인 추억이 완성돼요.',
    visual: () => {}, // <VisualThree />,
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get('callback');
  const userId = useAuthStore((state) => state.userId);
  const isLastStep = step === ONBOARDING_DATA.length - 1;

  const finishOnboarding = () => {
    if (userId) {
      localStorage.setItem(`has_seen_onboarding_${userId}`, 'true');
    }
    // callback이 있으면 해당 페이지로, 없으면 홈으로
    router.replace(callback || '/');
  };

  const nextStep = () => {
    if (!isLastStep) setStep(step + 1);
    else finishOnboarding();
  };

  return (
    <div className="flex flex-col h-dvh bg-white text-black overflow-hidden font-sans safe-area-bottom">
      <div className="flex justify-end p-4">
        {!isLastStep ? (
          <button
            onClick={finishOnboarding}
            className="text-gray-400 text-sm font-medium"
          >
            건너뛰기
          </button>
        ) : (
          <div className="p-2.5" />
        )}
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full flex flex-col items-center px-8"
          >
            <div className="shrink-0 flex flex-col items-center py-6 text-center space-y-4 w-full">
              <h1 className="text-2xl font-bold leading-tight whitespace-pre-line">
                {ONBOARDING_DATA[step].title}
              </h1>
              <p className="text-gray-500 text-[15px] leading-relaxed whitespace-pre-line">
                {ONBOARDING_DATA[step].description}
              </p>
            </div>

            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              <div className="w-full aspect-square max-h-80 bg-gray-50 rounded-3xl flex items-center justify-center relative overflow-hidden">
                {/* {ONBOARDING_DATA[step].visual()} */}
                <span className="text-gray-300 font-bold">Visual Area</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 space-y-6 shrink-0">
        <div className="flex justify-center gap-2">
          {ONBOARDING_DATA.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="group relative py-2"
              aria-label={`${i + 1}번 페이지로 이동`}
            >
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step
                    ? 'w-6 bg-itta-black'
                    : 'w-1.5 bg-gray-200 group-hover:bg-gray-300', // 호버 시 살짝 진해지는 효과
                )}
              />
            </button>
          ))}
        </div>

        <Button
          onClick={nextStep}
          className="w-full h-14 hover:bg-itta-black rounded-2xl text-lg font-bold shadow-sm bg-itta-black text-white"
        >
          {isLastStep ? '시작하기' : '다음'}
        </Button>
      </div>
    </div>
  );
}
