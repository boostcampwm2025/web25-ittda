'use client';

import { useEffect, useState, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useScrollToTop(
  target?: RefObject<HTMLElement | null>,
  thresholdPx?: number,
) {
  const shouldReduceMotion = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const scrollEl = target?.current;
    const listenTarget: Window | HTMLElement = scrollEl ?? window;

    const handleScroll = () => {
      const scrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;
      const threshold = thresholdPx ?? window.innerHeight * 0.75;
      setShow(scrollTop > threshold);
    };

    handleScroll();
    listenTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => listenTarget.removeEventListener('scroll', handleScroll);
  }, [target, thresholdPx]);

  const scrollToTop = () => {
    const behavior = shouldReduceMotion ? 'auto' : 'smooth';
    if (target?.current) {
      target.current.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  };

  return { show, scrollToTop };
}