'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ComponentType, ReactNode, Suspense } from 'react';
import ErrorBoundary, { FallbackProps } from './ErrorBoundary';

interface PropsType {
  children: React.ReactNode;
  fallbackComponent: ComponentType<FallbackProps>;
  suspenseFallback: ReactNode;
}

export default function ErrorHandlingWrapper({
  children,
  fallbackComponent: FallbackComponent,
  suspenseFallback: SuspenseFallback,
}: PropsType) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={FallbackComponent}>
          <Suspense fallback={SuspenseFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
