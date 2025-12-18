import { useEffect, useRef, useState } from 'react';

export function useScrollDirection<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const lastScrollTop = useRef(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;

      // 최상단에서는 항상 보이게
      if (currentScrollTop <= 10) {
        setIsVisible(true);
        lastScrollTop.current = currentScrollTop;
        return;
      }

      // 미세 스크롤 무시
      if (Math.abs(currentScrollTop - lastScrollTop.current) < 5) return;

      if (currentScrollTop < lastScrollTop.current) {
        // 위로 스크롤
        setIsVisible(true);
      } else {
        // 아래로 스크롤
        setIsVisible(false);
      }

      lastScrollTop.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return { containerRef, isVisible };
}
