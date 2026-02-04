'use client';

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/errorHandler';

export default function Providers({ children }: { children: React.ReactNode }) {
  // 렌더마다 새 QueryClient 생성 방지 (중요)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;
            // 쿼리 에러 시 토스트 표시
            const message = getErrorMessage(error);
            toast.error(message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, variables, context, mutation) => {
            if (mutation.meta?.silent) return;
            // mutation 에러 시 토스트 표시
            const message = getErrorMessage(error);
            toast.error(message);
          },
        }),
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // 인증 에러는 재시도하지 않음
              if (
                error instanceof Error &&
                'isAuthError' in error &&
                error.isAuthError === true
              ) {
                return false;
              }
              // 최대 3번 재시도
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false, // mutation은 재시도하지 않음
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          classNames: {
            error: 'bg-red-500 text-white',
            success: 'bg-green-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white',
          },
        }}
      />
    </QueryClientProvider>
  );
}
