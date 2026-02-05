'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeColorSetter() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // React 19의 cascading renders 에러 방지를 위한 지연 처리
    const raId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raId);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const color = resolvedTheme === 'dark' ? '#121212' : '#ffffff';
    const metaThemeColors = document.querySelectorAll(
      'meta[name="theme-color"]',
    );

    if (metaThemeColors.length > 0) {
      metaThemeColors.forEach((meta) => {
        if (meta.getAttribute('content') !== color) {
          meta.setAttribute('content', color);
        }
      });
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
  }, [resolvedTheme, mounted]);

  return null;
}
