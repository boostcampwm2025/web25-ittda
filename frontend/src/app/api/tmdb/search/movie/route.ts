import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const apiKey = process.env.NEXT_PUBLIC_MOVIE_API_KEY;

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 },
    );
  }

  if (!apiKey) {
    // API 키 미설정은 심각한 설정 오류
    const error = new Error('TMDB API 키가 설정되지 않았습니다');
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        context: 'tmdb-api',
        operation: 'search-movie',
        configError: 'missing-api-key',
      },
    });
    logger.error('TMDB API 키가 설정되지 않았습니다');
    return NextResponse.json(
      { success: false, error: 'TMDB API key is not configured', data: null },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=ko-KR`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      logger.error('TMDB API 응답 에러');

      const error = new Error(`TMDB API 응답 에러: ${response.status}`);
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'tmdb-api',
          operation: 'search-movie',
        },
        extra: {
          statusCode: response.status,
          query,
        },
      });
      throw error;
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // TMDB API 호출 실패
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        context: 'tmdb-api',
        operation: 'search-movie',
      },
      extra: {
        query,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    logger.error('TMDB API Error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch movie data', data: null },
      { status: 500 },
    );
  }
}
