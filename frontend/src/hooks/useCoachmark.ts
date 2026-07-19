'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { userProfileOptions } from '@/lib/api/profile';
import { useApiPatch } from '@/hooks/useApi';

// 롤 제약 등으로 타겟이 애초에 렌더되지 않을 수 있는 스텝을 위한 포기 시간.
const TARGET_NOT_FOUND_TIMEOUT = 4000;

export interface CoachmarkStep {
  id: string;
  title: string;
  description: string;
  // 모바일 폭에서 스포트라이트 박스를 아래로 살짝 내릴 px(기본 0).
  // BottomNavigation처럼 아이콘 특성상 살짝 위로 치우쳐 보이는 타겟에만 사용.
  yOffsetMobile?: number;
  // 모바일 폭에서 스포트라이트 박스를 오른쪽으로 살짝 옮길 px(기본 0).
  xOffsetMobile?: number;
  // 타겟 비율 기반 자동 여백 대신 고정 여백을 쓰고 싶을 때(예: 아이콘 하나만 딱 감싸기).
  spotlightPadding?: number;
}

interface UseCoachmarkOptions {
  flowKey: string;
  steps: CoachmarkStep[];
  enabled?: boolean;
}

export function useCoachmark({
  flowKey,
  steps,
  enabled = true,
}: UseCoachmarkOptions) {
  const userId = useAuthStore((state) => state.userId);
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const { data: profile, isLoading } = useQuery({
    ...userProfileOptions(),
    enabled: !!userId && enabled,
  });

  const seenCoachmarks = Array.isArray(profile?.user?.settings?.seenCoachmarks)
    ? (profile!.user!.settings!.seenCoachmarks as string[])
    : [];
  const hasSeen = seenCoachmarks.includes(flowKey);

  const { mutate: updateSettings } = useApiPatch<
    unknown,
    { settings: Record<string, unknown> }
  >('/api/me/settings', {
    invalidateKeys: [['profile', 'me']],
  });

  // 공지 모달이 떠 있는 동안은 코치마크를 시작하지 않고, 닫히면 바로 시작한다
  useEffect(() => {
    const check = () =>
      setAnnouncementOpen(
        !!document.querySelector('[data-announcement-modal]'),
      );
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const isActive =
    enabled &&
    !!userId &&
    !isLoading &&
    !hasSeen &&
    !announcementOpen &&
    !dismissed;

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // 타겟 요소의 위치를 계속 추적한다. 한 번만 측정하면 모바일 주소창
  // 축소/확대로 인한 viewport 높이 변화, 진입 애니메이션, role 조회처럼
  // 늦게 마운트되는 버튼 등 다양한 이유로 값이 어긋날 수 있어서,
  // 활성화돼 있는 동안은 매 프레임 실제 위치를 다시 읽어 항상 최신 상태로 맞춘다.
  useEffect(() => {
    if (!isActive) return;

    let rafId: number;
    let cancelled = false;
    const selector = `[data-tutorial-id="${currentStep.id}"]`;

    const track = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(selector);
      setRect((prev) => {
        const next = el ? el.getBoundingClientRect() : null;
        if (!next) return prev && !el ? null : prev;
        if (
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next;
      });
      rafId = requestAnimationFrame(track);
    };

    rafId = requestAnimationFrame(track);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [isActive, currentStep]);

  const finish = () => {
    setDismissed(true);
    if (userId) {
      const next = Array.from(new Set([...seenCoachmarks, flowKey]));
      updateSettings({ settings: { seenCoachmarks: next } });
    }
  };

  const nextStep = () => {
    if (isLastStep) {
      finish();
    } else {
      setStepIndex((s) => s + 1);
    }
  };

  // 롤(예: VIEWER)에 따라 타겟이 애초에 렌더되지 않는 경우가 있다(예: 초대 버튼은
  // 뷰어에게 안 보임). 그런 스텝에서 타겟을 계속 못 찾으면 영원히 멈춰서 아무것도
  // 안 뜨는 상태가 되므로, 일정 시간 못 찾으면 자동으로 다음 스텝으로 넘어간다.
  useEffect(() => {
    if (!isActive || rect) return;
    const timeoutId = setTimeout(() => {
      nextStep();
    }, TARGET_NOT_FOUND_TIMEOUT);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStep, rect]);

  return {
    isActive,
    step: currentStep,
    isLastStep,
    rect: isActive ? rect : null,
    nextStep,
    skip: finish,
  };
}
