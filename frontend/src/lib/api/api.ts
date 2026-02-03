import { ApiResponse } from '../types/response';
import { getAccessToken, refreshAccessToken, handleLogout } from './auth';

/**
 * API Base URL 결정
 * - 클라이언트: '' (빈 문자열, Next.js rewrites가 /api/* 처리)
 * - 서버: 백엔드 절대 URL (fetch는 상대 경로 불가)
 */
function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    return '';
  }

  // 클라이언트 환경
  if (typeof window !== 'undefined') {
    return '';
  }

  // 서버 환경 - 백엔드 절대 URL
  const backendUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_PRODUCTION_API_URL
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
  return backendUrl;
}

const API_BASE_URL = getApiBaseUrl();

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

    if (response.status === 204) {
      return {
        success: true,
        data: {},
        error: null,
      };
    }

    // CSRF 요청 자체가 에러를 뱉을 때를 대비해 응답을 파싱하기 전에도 체크
    if (url.includes('/api/auth/csrf') || url.includes('/api/auth/session')) {
      return await response.json(); // NextAuth 요청은 그냥 결과를 반환하고 끝냄
    }

    const data = await response.json();

    // 토큰 만료 에러 처리 (인터셉터 역할)
    if (
      !data.success &&
      data.error?.code === 'UNAUTHORIZED' &&
      !skipAuth &&
      !url.includes('/auth/refresh') // 재발급 API 자체의 실패는 제외
    ) {
      if (typeof window === 'undefined') {
        // 서버 컴포넌트 환경이라면 토큰 재발급이 아닌 세션 초기화 후 로그인 재요청
        const { redirect } = await import('next/navigation');
        redirect('/login?reason=expired');
        return;
      }

      // 토큰 재발급 시도
      const newToken = await refreshAccessToken();

      if (!newToken) {
        // 재발급 실패 - 로그아웃 처리
        await handleLogout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
          return;
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
      const finalHeaders = new Headers(fetchOptions.headers);
      finalHeaders.set('Authorization', `Bearer ${newToken}`);

      return fetchWithRetry<T>(
        url,
        { ...fetchOptions, headers: finalHeaders },
        attempt,
        maxRetries,
        retryDelay,
        skipAuth,
      );
    }

    return {
      ...data,
      headers: response.headers,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('unknown error');

    // JSON 파싱 에러는 재시도하지 않음
    if (
      err.message.includes('JSON') ||
      err.message.includes('Unexpected token')
    ) {
      return {
        success: false,
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: '서버 응답을 처리할 수 없습니다.',
          details: { originalError: err.message },
        },
      };
    }

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

  const currentBaseUrl = getApiBaseUrl();
  // 서버 환경에서는 /api -> /v1로 변환 (rewrites 규칙 반영)
  const finalEndpoint =
    typeof window === 'undefined'
      ? endpoint.replace(/^\/api/, '/v1')
      : endpoint;

  let fullUrl = `${currentBaseUrl}${finalEndpoint}`;
  // 서버 환경인데 여전히 상대경로라면 강제로 도메인을 붙여줌 (방어 코드)
  if (typeof window === 'undefined' && !fullUrl.startsWith('http')) {
    const fallback =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    fullUrl = `${fallback}${finalEndpoint.replace(/^\/api/, '')}`;
  }

  const url = buildUrl(fullUrl, params);
  // 인증 헤더 추가
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 액세스 토큰이 있고 skipAuth가 false면 Authorization 헤더 추가
  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      (defaultHeaders as Record<string, string>).Authorization =
        `Bearer ${token}`;
    }
  }

  // 서버 환경에서 fetch 실행시 쿠키 전달
  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers: defaultHeaders,
  };

  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (finalOptions.headers as any).cookie = (await cookies()).toString();
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
