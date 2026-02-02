import { MediaValue } from '../types/recordField';
import * as Sentry from '@sentry/nextjs';
import { logger } from '../utils/logger';

const KOPIS_API_KEY = process.env.NEXT_PUBLIC_KOPIS_API_KEY;

//TMDB 영화 검색 API
export const searchMovies = async (query: string): Promise<MediaValue[]> => {
  try {
    const response = await fetch(
      `/api/tmdb/search/movie?query=${encodeURIComponent(query)}`,
    );
    const data = await response.json();

    if (!data.results) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.results.map((item: any) => ({
      externalId: String(item.id),
      title: item.title,
      originalTitle: item.original_title,
      imageUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
        : undefined,
      year: item.release_date ? item.release_date.split('-')[0] : '-',
      type: '영화',
    }));
  } catch (error) {
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        context: 'external-media',
        operation: 'search-movie',
      },
      extra: {
        query: query,
      },
    });
    logger.error('Movie API ', error);

    return [];
  }
};

// KOPIS 연극/뮤지컬 검색 API
export const searchKopis = async (
  query: string,
  cateCode: string,
  typeName: string,
): Promise<MediaValue[]> => {
  try {
    const stdate = '20230101';
    const eddate = '20261231';

    const response = await fetch(
      `/api/kopis/pblprfr?service=${KOPIS_API_KEY}&stdate=${stdate}&eddate=${eddate}&cpage=1&rows=20&shprfnm=${encodeURIComponent(query)}&shcate=${cateCode}`,
    );
    const str = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(str, 'text/xml');
    const dbElements = xml.getElementsByTagName('db');

    // TODO: externalId 추가 필요
    return Array.from(dbElements).map((db) => ({
      externalId: db.getElementsByTagName('mt20id')[0]?.textContent || '',
      title: db.getElementsByTagName('prfnm')[0]?.textContent || '',
      originalTitle: null, // KOPIS는 별도의 원제 필드가 모호하므로 null 처리
      imageUrl: db.getElementsByTagName('poster')[0]?.textContent || undefined,
      year: (db.getElementsByTagName('prfpdfrom')[0]?.textContent || '-').split(
        '.',
      )[0],
      type: typeName,
    }));
  } catch (error) {
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        context: 'external-media',
        operation: 'search-kopis',
      },
      extra: {
        query: query,
        cateCode: cateCode,
        typeName: typeName,
      },
    });
    logger.error('KOPIS API', error);

    return [];
  }
};
