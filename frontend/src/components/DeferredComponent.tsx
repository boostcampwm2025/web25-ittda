'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
};

// 로딩이 시작된 후 특정 시점까지 로더를 보여주지 않기 위한 용도
export default function DeferredComponent({ children }: Props) {
  const [isDeferred, setIsDeferred] = useState(false);

  useEffect(() => {
    // 200ms 지난 후 children render
    const timeoutId = setTimeout(() => {
      setIsDeferred(true);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isDeferred) {
    return null;
  }

  return children;
}
