'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';

const ONBOARDING_DATA = [
  {
    title: '사진 한 장만 올리세요,\n기록은 저희가 할게요',
    description:
      '이미지 속 날짜, 시간, 장소를 자동으로 불러와 채워드려요.\n이제 일일이 기억해낼 필요 없이, 추억에만 집중하세요.',
    image: '/onboarding1.png',
    gradient:
      'from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30',
    accentColor: 'bg-blue-400/20 dark:bg-blue-400/10',
  },
  {
    title: '취향대로 만드는\n커스텀 기록지',
    description:
      '평점, 감정, 표 등 원하는 필드를 자유롭게 배치해 보세요.\n모든 순간이 나만의 스타일로 보관돼요.',
    image: '/onboarding2.png',
    gradient:
      'from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30',
    accentColor: 'bg-orange-400/20 dark:bg-orange-400/10',
  },
  {
    title: '따로 또 같이,\n우리만의 집단적 기억',
    description:
      '친구와 함께 여행 기록을 편집해 보세요.\n각자의 시선이 모여 하나의 입체적인 추억이 완성돼요.',
    image: '/onboarding3.png',
    gradient:
      'from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30',
    accentColor: 'bg-green-400/20 dark:bg-green-400/10',
  },
];

interface OnboardingContentProps {
  callback?: string;
}

export default function OnboardingContent({ callback }: OnboardingContentProps) {
  const [step, setStep] = useState(0);
  const router = useRouter();
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

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-[#0F1115] text-black dark:text-white overflow-hidden font-sans safe-area-bottom relative">
      {/* 배경 그라디언트 */}
      <div
        className={cn(
          'absolute inset-0 bottom-0 bg-gradient-to-br transition-all duration-700',
          ONBOARDING_DATA[step].gradient,
        )}
      />

      <div className="flex justify-end p-4 relative z-10">
        {!isLastStep ? (
          <button
            onClick={finishOnboarding}
            className="text-gray-400 dark:text-gray-500 text-sm font-medium"
          >
            건너뛰기
          </button>
        ) : (
          <div className="p-2.5" />
        )}
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(e, { offset, velocity }) => {
              const swipeThreshold = 50;
              const swipeVelocity = 500;

              // offset 또는 velocity 기준으로 스와이프 판단
              if (offset.x < -swipeThreshold || velocity.x < -swipeVelocity) {
                // 왼쪽으로 스와이프 (다음)
                nextStep();
              } else if (
                offset.x > swipeThreshold ||
                velocity.x > swipeVelocity
              ) {
                // 오른쪽으로 스와이프 (이전)
                prevStep();
              }
            }}
            className="h-full flex flex-col items-center px-6"
          >
            <div className="shrink-0 flex flex-col items-center pt-2 pb-4 text-center space-y-2.5 w-full px-4">
              <h1 className="text-[22px] font-bold leading-[1.3] whitespace-pre-line dark:text-white">
                {ONBOARDING_DATA[step].title}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-[13px] leading-normal whitespace-pre-line max-w-sm">
                {ONBOARDING_DATA[step].description}
              </p>
            </div>

            <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
              {/* 장식용 원형 배경 */}
              <div
                className={cn(
                  'absolute w-72 h-72 rounded-full blur-3xl opacity-40 transition-colors duration-700',
                  ONBOARDING_DATA[step].accentColor,
                )}
              />

              <div className="w-full h-full flex items-center justify-center relative max-w-sm">
                {/* 이미지 그림자 효과 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[90%] h-[90%] bg-black/5 dark:bg-white/5 rounded-3xl blur-2xl" />
                </div>

                <Image
                  src={ONBOARDING_DATA[step].image}
                  alt={ONBOARDING_DATA[step].title}
                  width={384}
                  height={384}
                  className="object-contain w-full h-full relative z-10 drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col justify-center items-center p-6 pb-10 space-y-6 shrink-0 relative z-10">
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
                    ? 'w-6 bg-itta-black dark:bg-white shadow-lg'
                    : 'w-1.5 bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500',
                )}
              />
            </button>
          ))}
        </div>

        <Button
          onClick={isLastStep ? finishOnboarding : nextStep}
          className="w-full h-12 max-w-96 z-10 hover:bg-itta-black dark:hover:bg-white dark:hover:text-black rounded-2xl text-base font-bold shadow-xl bg-itta-black dark:bg-white text-white dark:text-black transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLastStep ? '시작하기' : '다음'}
        </Button>
      </div>
    </div>
  );
}
