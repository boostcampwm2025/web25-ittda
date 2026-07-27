'use client';

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { type ApiError } from '@/lib/utils/errorHandler';
import { showErrorToast } from '@/lib/utils/errorToast';

export default function Providers({ children }: { children: React.ReactNode }) {
  // 렌더마다 새 QueryClient 생성 방지 (중요)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;
            if ((error as ApiError)?.code === 'TIMEOUT') {
              toast.error('요청 시간이 초과되었습니다.', {
                description: '네트워크 연결을 확인하고 다시 시도해 주세요.',
                duration: 8000,
                action: {
                  label: '다시 시도',
                  onClick: () => {
                    (query as unknown as { fetch: () => void }).fetch();
                  },
                },
              });
              return;
            }
            showErrorToast(error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, variables, _context, mutation) => {
            if (mutation.meta?.silent) return;
            if ((error as ApiError)?.code === 'TIMEOUT') {
              toast.error('요청 시간이 초과되었습니다.', {
                description: '네트워크 연결을 확인하고 다시 시도해 주세요.',
                duration: 8000,
                action: {
                  label: '다시 시도',
                  onClick: () => {
                    (
                      mutation as unknown as {
                        execute: (v: unknown) => void;
                      }
                    ).execute(variables);
                  },
                },
              });
              return;
            }
            showErrorToast(error);
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
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
        offset={{ top: 32, bottom: 'var(--bottom-nav-height)' }}
        toastOptions={{
          classNames: {
            toast: 'mt-5',
            error: 'bg-red-500 text-white mt-5',
            success: 'bg-green-500 text-white mt-5',
            warning: 'bg-yellow-500 text-white mt-5',
            info: 'bg-blue-500 text-white mt-5',
          },
        }}
      />
    </QueryClientProvider>
  );
}
