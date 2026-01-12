import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { get, post, put, del, patch } from '@/lib/api/api';
import type { ApiResponse } from '@/lib/types/response';
import {
  createApiError,
  isTokenExpiredError,
  retryWithTokenRefresh,
} from '@/lib/utils/errorHandler';

type FetchParams = Record<string, string | number | boolean>;

interface UseApiQueryOptions<TData, TError = Error>
  extends Omit<
    UseQueryOptions<ApiResponse<TData>, TError, TData, QueryKey>,
    'queryKey' | 'queryFn'
  > {
  params?: FetchParams;
}

type UseApiMutationOptions<TData, TVariables, TError = Error> = Omit<
  UseMutationOptions<ApiResponse<TData>, TError, TVariables, unknown>,
  'mutationFn'
>;

/**
 * GET 요청을 위한 훅
 * @example
 * const { data, isLoading, error } = useApiQuery(['users', userId], `/users/${userId}`);
 */
export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  endpoint: string,
  options?: UseApiQueryOptions<TData>,
) {
  const { params, ...queryOptions } = options || {};

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await get<TData>(endpoint, params);

      // 에러 응답 처리
      if (!response.success) {
        const error = createApiError(response);

        // 토큰 만료 시 재발급 후 재시도
        if (isTokenExpiredError(error.code)) {
          return retryWithTokenRefresh(() => get<TData>(endpoint, params));
        }

        throw error;
      }

      return response;
    },
    select: (response) => {
      if (!response.success) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    ...queryOptions,
  });
}

/**
 * POST 요청을 위한 훅
 * @example
 * const { mutate, isPending } = useApiPost('/users', {
 *   onSuccess: (data) => console.log(data),
 * });
 * mutate({ name: 'John' });
 */
export function useApiPost<TData = unknown, TVariables = Record<string, unknown>>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, TVariables>,
  sendCookie?: boolean,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await post<TData>(
        endpoint,
        variables as Record<string, unknown>,
        undefined,
        sendCookie,
      );

      if (!response.success) {
        const error = createApiError(response);

        // 토큰 만료 시 재발급 후 재시도
        if (isTokenExpiredError(error.code)) {
          return retryWithTokenRefresh(() =>
            post<TData>(
              endpoint,
              variables as Record<string, unknown>,
              undefined,
              sendCookie,
            ),
          );
        }

        throw error;
      }

      return response;
    },
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context, mutationContext);
    },
    ...options,
  });
}

/**
 * PUT 요청을 위한 훅
 * @example
 * const { mutate } = useApiPut('/users/1');
 * mutate({ name: 'John Updated' });
 */
export function useApiPut<TData = unknown, TVariables = Record<string, unknown>>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await put<TData>(endpoint, variables as Record<string, unknown>);

      if (!response.success) {
        const error = createApiError(response);

        if (isTokenExpiredError(error.code)) {
          return retryWithTokenRefresh(() =>
            put<TData>(endpoint, variables as Record<string, unknown>),
          );
        }

        throw error;
      }

      return response;
    },
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context, mutationContext);
    },
    ...options,
  });
}

/**
 * DELETE 요청을 위한 훅
 * @example
 * const { mutate } = useApiDelete('/users');
 * mutate('123');
 */
export function useApiDelete<TData = unknown, TVariables = unknown>(
  endpoint: string | ((variables: TVariables) => string),
  options?: UseApiMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const url = typeof endpoint === 'function' ? endpoint(variables) : endpoint;
      const response = await del<TData>(url);

      if (!response.success) {
        const error = createApiError(response);

        if (isTokenExpiredError(error.code)) {
          return retryWithTokenRefresh(() => del<TData>(url));
        }

        throw error;
      }

      return response;
    },
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context, mutationContext);
    },
    ...options,
  });
}

/**
 * PATCH 요청을 위한 훅
 * @example
 * const { mutate } = useApiPatch('/users/1');
 * mutate({ name: 'John' });
 */
export function useApiPatch<TData = unknown, TVariables = Record<string, unknown>>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, TVariables>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await patch<TData>(endpoint, variables as Record<string, unknown>);

      if (!response.success) {
        const error = createApiError(response);

        if (isTokenExpiredError(error.code)) {
          return retryWithTokenRefresh(() =>
            patch<TData>(endpoint, variables as Record<string, unknown>),
          );
        }

        throw error;
      }

      return response;
    },
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context, mutationContext);
    },
    ...options,
  });
}
