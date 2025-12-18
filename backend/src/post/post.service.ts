import { Injectable, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';

export interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

type TemplateType =
  | 'diary'
  | 'travel'
  | 'movie'
  | 'musical'
  | 'theater'
  | 'memo'
  | 'etc';

export interface Post {
  id: string;
  title: string;
  templateType: TemplateType;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  content: string;
  imageUrl?: string;
}

@Injectable()
export class PostService {
  /**
   * TODO: 향후 PostgreSQL + PostGIS로 대체 예정.
   * 현재는 간단한 인메모리 데이터로 /posts, /posts/:id 를 제공한다.
   */
  private readonly posts: Post[] = this.createSeedPosts();

  findByBbox(bbox: Bbox, limit = 50): Post[] {
    const { minLat, minLng, maxLat, maxLng } = bbox;

    return this.posts
      .filter(
        (post) =>
          post.lat >= minLat &&
          post.lat <= maxLat &&
          post.lng >= minLng &&
          post.lng <= maxLng,
      )
      .sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
      )
      .slice(0, limit);
  }

  findOne(id: string): Post {
    const found = this.posts.find((post) => post.id === id);

    if (!found) {
      throw new NotFoundException(`Post not found: ${id}`);
    }

    return found;
  }

  private createSeedPosts(): Post[] {
    // 서울 시청 근처를 중심으로 한 몇 개의 더미 데이터
    const baseLat = 37.5665;
    const baseLng = 126.978;

    const makePost = (overrides: Partial<Post>): Post => {
      const id = overrides.id ?? crypto.randomUUID();
      const createdAt = overrides.createdAt ?? new Date().toISOString();

      return {
        id,
        title: '제목 없는 일기',
        templateType: 'diary',
        address: '서울특별시 중구 세종대로 110',
        lat: baseLat,
        lng: baseLng,
        content:
          '이것은 인메모리 더미 게시글입니다. 실제 데이터베이스 연동 전까지는 서버 메모리에서만 관리됩니다.',
        imageUrl:
          overrides.imageUrl ??
          faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
        ...overrides,
        createdAt,
      };
    };

    return [
      makePost({
        title: '광화문 근처 카페',
        address: '서울특별시 종로구 종로 1',
        lat: baseLat + 0.005,
        lng: baseLng + 0.003,
        content: '광화문 근처 카페에서 커피를 마셨다.',
      }),
      makePost({
        title: '을지로 맛집 탐방',
        templateType: 'travel',
        address: '서울특별시 중구 을지로 3가',
        lat: baseLat - 0.004,
        lng: baseLng + 0.006,
        content: '을지로 골목골목을 돌아다니며 맛집을 방문했다.',
      }),
      makePost({
        title: '한강 야경 산책',
        templateType: 'etc',
        address: '서울특별시 영등포구 여의도동',
        lat: baseLat - 0.02,
        lng: baseLng - 0.02,
        content: '여의도 한강공원에서 야경을 보며 산책했다.',
      }),
    ];
  }
}
