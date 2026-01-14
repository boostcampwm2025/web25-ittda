import { ApiResponse } from '../types/response';
import { getAccessToken, refreshAccessToken, clearTokens } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  maxRetries?: number; // 최대 재시도 횟수
  retryDelay?: number; // 초기 재시도 지연 시간 ms
  skipAuth?: boolean; // 인증 헤더 제외 (로그인, 회원가입 등)
}

/**
 * 쿼리 파라미터를 URL에 추가하는 헬퍼 함수
 */
function buildUrl(baseUrl: string, params?: FetchOptions['params']) {
  if (!params) return baseUrl;

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * 지연 함수 (재시도를 위한 대기)
 */
function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRetry<T>(
  url: string,
  fetchOptions: RequestInit,
  attempt: number,
  maxRetries: number,
  retryDelay: number,
  skipAuth: boolean,
) {
  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    // 토큰 만료 에러 처리 (인터셉터 역할)
    if (
      !data.success &&
      data.error?.code === 'TOKEN_EXPIRED' &&
      !skipAuth &&
      !url.includes('/auth/reissue') // 재발급 API는 제외
    ) {
      // 토큰 재발급 시도
      const newToken = await refreshAccessToken();

      if (!newToken) {
        // 재발급 실패 - 로그인 페이지로 리다이렉트
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 만료되었습니다. 다시 로그인해주세요.',
            details: {},
          },
        };
      }

      // 새 토큰으로 헤더 업데이트 후 재시도
      const newHeaders = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${newToken}`,
      } as HeadersInit;

      return fetchWithRetry<T>(
        url,
        { ...fetchOptions, headers: newHeaders },
        attempt,
        maxRetries,
        retryDelay,
        skipAuth,
      );
    }

    return data;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('unknown error');

    // 마지막 시도면 에러 반환
    if (attempt >= maxRetries) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message,
          details: {},
        },
      };
    }

    // 재시도 전 대기 1 -> 2 -> 4
    const waitTime = retryDelay * 2 ** attempt;
    await delay(waitTime);

    return fetchWithRetry<T>(
      url,
      fetchOptions,
      attempt + 1,
      maxRetries,
      retryDelay,
      skipAuth,
    );
  }
}

/**
 * 공통 fetch 함수
 * 네트워크 에러 시 자동 재시도
 * 비즈니스 에러(!response.ok)는 재시도하지 않음
 */
export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
  sendCookie?: boolean,
) {
  const {
    params,
    headers = {},
    maxRetries = 3,
    retryDelay = 1000,
    skipAuth = false,
    ...fetchOptions
  } = options;

  const url = buildUrl(`${API_BASE_URL}${endpoint}`, params);

  // 인증 헤더 추가
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 액세스 토큰이 있고 skipAuth가 false면 Authorization 헤더 추가
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      (defaultHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return fetchWithRetry<T>(
    url,
    {
      ...fetchOptions,
      headers: defaultHeaders,
      ...(sendCookie ? { credentials: 'include' } : {}),
    }, // 쿠키에 담긴 refresh token을 보호하기 위해 reissue를 보낼 때만 허용
    0,
    maxRetries,
    retryDelay,
    skipAuth,
  );
}

export async function get<T>(
  endpoint: string,
  params?: FetchOptions['params'],
  options?: Omit<FetchOptions, 'params'>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'GET',
    params,
  });
}

export async function post<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: FetchOptions,
  sendCookie?: boolean,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(
    endpoint,
    {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    },
    sendCookie,
  );
}

export async function put<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: FetchOptions,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T>(
  endpoint: string,
  options?: FetchOptions,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

export async function patch<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options?: FetchOptions,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}
