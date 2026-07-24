'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { PointerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoachmark, type CoachmarkStep } from '@/hooks/useCoachmark';

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

const SPOTLIGHT_PADDING_MIN = 7;
const SPOTLIGHT_PADDING_MAX = 10;
const SPOTLIGHT_PADDING_RATIO = 0.2; // 타겟의 짧은 변에 비례한 여백(고정값 대신 상대값 사용)
const MOBILE_PADDING_REDUCTION = 2; // 모바일 폭에서만 패딩을 살짝 더 줄임(= left가 그만큼 커짐)
const MOBILE_BREAKPOINT = 640; // Tailwind sm 기준 — 이 아래에서만 step.yOffsetMobile 적용
const SPOTLIGHT_RADIUS = 16;
const VIEWPORT_MARGIN = 12; // 스포트라이트가 화면 밖으로 나가지 않도록 두는 여백
const TEXT_WIDTH = 280;
const TEXT_MARGIN = 20;
const TEXT_TOP_RATIO = 0.4; // 뷰포트 높이의 40% 지점에 텍스트 블록 배치(원래 위치)
const ARROW_EDGE_GAP = 10; // 화살표 시작/끝을 텍스트·스포트라이트 가장자리에서 살짝 띄우는 여백

interface CoachmarkProps {
  flowKey: string;
  steps: CoachmarkStep[];
  enabled?: boolean;
}

export default function Coachmark({ flowKey, steps, enabled }: CoachmarkProps) {
  const { isActive, step, isLastStep, rect, nextStep, skip } = useCoachmark({
    flowKey,
    steps,
    enabled,
  });

  const textRef = useRef<HTMLDivElement>(null);
  const [textRect, setTextRect] = useState<DOMRect | null>(null);

  // 텍스트 블록이 실제로 렌더된 높이를 측정해서, 화살표가 텍스트를 가리지 않고
  // 정확히 텍스트가 끝나는 지점부터 시작하도록 한다(추정치 대신 실측값 사용).
  useLayoutEffect(() => {
    if (!isActive) return;
    const raf = requestAnimationFrame(() => {
      setTextRect(textRef.current?.getBoundingClientRect() ?? null);
    });
    return () => cancelAnimationFrame(raf);
  }, [isActive, step, rect]);

  if (typeof document === 'undefined') return null;
  if (!isActive || !step || !rect) return null;

  // 타겟의 실제 가로세로 비율을 그대로 살린 라운드 사각형 스포트라이트
  // (원형으로 고정하면 툴바처럼 가로로 넓은 타겟이 어색해짐)
  // 여백은 고정 px이 아니라 타겟의 짧은 변에 비례하게 계산한다 — 그래야
  // 모바일의 작은 네비 아이콘과 데스크톱의 넓은 툴바 모두에서 비율이 자연스럽다.
  const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
  const spotlightPadding =
    step.spotlightPadding ??
    Math.min(
      SPOTLIGHT_PADDING_MAX,
      Math.max(
        SPOTLIGHT_PADDING_MIN,
        Math.min(rect.width, rect.height) * SPOTLIGHT_PADDING_RATIO,
      ),
    ) - (isMobileWidth ? MOBILE_PADDING_REDUCTION : 0);
  // 스텝마다 필요한 경우에만(예: BottomNavigation 아이템) 모바일 폭에서 살짝 내리거나 옆으로 옮긴다.
  // 같은 타겟이어도 웹과 Capacitor 네이티브의 실측 렌더링이 달라서, 네이티브에서는
  // yOffsetMobileNative(없으면 0)를 쓰고 웹에서는 yOffsetMobile을 쓴다.
  const yOffset = isMobileWidth
    ? isNativePlatform()
      ? (step.yOffsetMobileNative ?? 0)
      : (step.yOffsetMobile ?? 0)
    : 0;
  const xOffset = isMobileWidth ? (step.xOffsetMobile ?? 0) : 0;
  // 화면 밖으로 나가지 않도록 뷰포트 안으로 먼저 clamp한 다음, offset은 그 위에 더한다.
  // 화면 가장자리에 붙은 타겟은 offset을 clamp 전에 더하면 "화면 밖으로 안 나가게"
  // 로직이 곧바로 다시 끌어당겨서 오프셋이 무효화된다.
  const rawSpotlight = {
    top: rect.top - spotlightPadding,
    left: rect.left - spotlightPadding,
    width: rect.width + spotlightPadding * 2,
    height: rect.height + spotlightPadding * 2,
  };
  const maxSpotlightTop =
    window.innerHeight - rawSpotlight.height - VIEWPORT_MARGIN;
  const clampedTop = Math.min(
    Math.max(rawSpotlight.top, VIEWPORT_MARGIN),
    maxSpotlightTop,
  );
  const spotlight = {
    left:
      Math.min(
        Math.max(rawSpotlight.left, VIEWPORT_MARGIN),
        window.innerWidth - rawSpotlight.width - VIEWPORT_MARGIN,
      ) + xOffset,
    // offset을 clamp 전 위치에 더하고, 재-clamp는 하지 않는다. 재-clamp를 하면
    // BottomNavigation처럼 이미 하단 가장자리 근처에 있는(=clampedTop이
    // maxSpotlightTop에 가까운) 타겟은 yOffsetMobile을 아무리 늘려도 상한에
    // 도로 눌려서 값이 반영되지 않는다 — 실제로 8→12.4로 늘려도 동일한 위치로
    // 계산되는 회귀가 있었다. 큰 값(예: 예전 nativeStatusBarOffset)이 화면
    // 밖으로 밀어낼 위험은 현재 이 값이 전부 작은 수동 튜닝값이라 낮다고 보고
    // 감수한다.
    top: clampedTop + yOffset,
    width: rawSpotlight.width,
    height: rawSpotlight.height,
  };
  const spotlightCenterX = spotlight.left + spotlight.width / 2;

  // 텍스트 블록은 원래대로 화면의 고정 위치(뷰포트 40% 지점)에 둔다.
  const textTop = window.innerHeight * TEXT_TOP_RATIO;
  const textLeft = Math.min(
    Math.max(spotlightCenterX - TEXT_WIDTH / 2, TEXT_MARGIN),
    window.innerWidth - TEXT_WIDTH - TEXT_MARGIN,
  );

  // 타겟이 텍스트 블록보다 아래에 있는지(주로 하단 네비/툴바) 위에 있는지(주로 상단 헤더 버튼)
  // 실측된 텍스트 블록 rect를 기준으로 판단해서, 화살표가 텍스트를 가로지르지 않고
  // 실제로 텍스트가 끝나는 지점에서 정확히 시작하게 한다.
  const targetBelowText = textRect
    ? spotlight.top > textRect.top
    : spotlight.top > textTop;
  const arrowStart = textRect
    ? {
        x: textRect.left + textRect.width / 2,
        y: targetBelowText
          ? textRect.bottom + ARROW_EDGE_GAP
          : textRect.top - ARROW_EDGE_GAP,
      }
    : null;
  const arrowEnd = {
    x: spotlightCenterX,
    y: targetBelowText
      ? spotlight.top - 6
      : spotlight.top + spotlight.height + 6,
  };
  const arrowControl = arrowStart
    ? {
        x: (arrowStart.x + arrowEnd.x) / 2 + 32,
        y: (arrowStart.y + arrowEnd.y) / 2,
      }
    : null;
  const arrowPath =
    arrowStart && arrowControl
      ? `M ${arrowStart.x} ${arrowStart.y} Q ${arrowControl.x} ${arrowControl.y} ${arrowEnd.x} ${arrowEnd.y}`
      : undefined;

  return createPortal(
    <>
      {/* 코치마크 중 실제 화면 클릭 차단 */}
      <div
        className="fixed inset-0 z-[99]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* 어두운 배경 + 타겟 부분만 뚫린 스포트라이트(타겟 비율 그대로) */}
      <div
        style={{
          position: 'fixed',
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: Math.min(SPOTLIGHT_RADIUS, spotlight.height / 2),
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
          pointerEvents: 'none',
          zIndex: 100,
          transition:
            'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
        }}
      />
      {/* 타겟 포인트 컬러 테두리 + 은은한 글로우 */}
      <div
        style={{
          position: 'fixed',
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: Math.min(SPOTLIGHT_RADIUS, spotlight.height / 2),
          boxShadow: '0 0 0 2px #10b981, 0 0 6px 0px rgba(16,185,129,0.5)',
          pointerEvents: 'none',
          zIndex: 101,
          transition:
            'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
        }}
      />

      {/* 탭 제스처 아이콘 */}
      <motion.div
        style={{
          position: 'fixed',
          top: spotlight.top - 14,
          left: spotlight.left + spotlight.width - 12,
          zIndex: 102,
        }}
        className="pointer-events-none text-white"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      >
        <PointerIcon className="w-6 h-6" fill="white" fillOpacity={0.2} />
      </motion.div>

      {/* 곡선 점선 화살표(텍스트 블록 실측 전에는 그리지 않음) */}
      {arrowPath && (
        <svg
          className="fixed inset-0 pointer-events-none"
          width="100%"
          height="100%"
          style={{ zIndex: 101 }}
        >
          <defs>
            <marker
              id="coachmark-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="white" fillOpacity={0.85} />
            </marker>
          </defs>
          <path
            d={arrowPath}
            fill="none"
            stroke="white"
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeDasharray="6 6"
            markerEnd="url(#coachmark-arrowhead)"
          />
        </svg>
      )}

      {/* AnimatePresence(mode="wait")는 스텝 전환 시 이전 블록을 잠시 화면에 남겨두는데,
          그 사이 textRef가 옛 위치의 블록을 측정해서 화살표가 어긋나는 원인이 됐다.
          스텝은 즉시 교체(React가 key 변경 시 동기적으로 언마운트+마운트)해서
          textRef가 항상 현재 위치의 블록만 가리키도록 한다. */}
      <motion.div
        key={step.id}
        ref={textRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: textLeft,
          top: textTop,
          width: TEXT_WIDTH,
          zIndex: 102,
        }}
      >
        <p className="text-xl font-bold text-white mb-1.5 leading-snug">
          {step.title}
        </p>
        <p className="text-sm text-white/70 mb-5 leading-relaxed">
          {step.description}
        </p>
        <div className="flex items-center gap-2">
          {!isLastStep && (
            <button
              onClick={skip}
              className="text-[13px] font-medium text-white/60 px-3 py-2"
            >
              건너뛰기
            </button>
          )}
          <Button
            size="sm"
            onClick={nextStep}
            className={cn(
              isLastStep
                ? 'bg-white text-itta-black hover:bg-white/90'
                : 'bg-white/15 text-white backdrop-blur hover:bg-white/25',
            )}
          >
            {isLastStep ? '확인' : '다음'}
          </Button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
