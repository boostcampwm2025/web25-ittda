'use client';

import FloatingScrollButton from './FloatingScrollButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';

export default function ScrollToTopButton() {
  const { show, scrollToTop } = useScrollToTop();

  return (
    <FloatingScrollButton
      show={show}
      onClick={scrollToTop}
      className="bottom-16 sm:bottom-24 bg-white/90 text-itta-black border border-gray-100 shadow-md backdrop-blur-xl hover:shadow-lg dark:bg-[#1E1E1E]/90 dark:text-white dark:border-white/10 dark:shadow-none"
    />
  );
}