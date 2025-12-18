import { Injectable, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { Bbox, Post, CreatePostDto } from './post.types';

@Injectable()
export class PostService {
  /**
   * TODO: 향후 PostgreSQL + PostGIS로 대체 예정.
   * 현재는 간단한 인메모리 데이터로 /posts, /posts/:id 를 제공한다.
   */
  private readonly posts: Post[] = this.createSeedPosts();

  /**
   * 단순 리스트 조회용 페이지네이션.
   * createdAt 내림차순으로 정렬 후 page/limit 기준으로 슬라이스한다.
   */
  findPaginated(page = 1, limit = 10): { items: Post[]; totalCount: number } {
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;

    const sorted = [...this.posts].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );

    const totalCount = sorted.length;
    const start = (safePage - 1) * safeLimit;
    const items = sorted.slice(start, start + safeLimit);

    return { items, totalCount };
  }

  findByBbox(bbox: Bbox, limit = 50): Post[] {
    const { minLat, minLng, maxLat, maxLng } = bbox;

    return this.posts
      .filter(
        (post) =>
          post.lat !== null &&
          post.lng !== null &&
          post.lat >= minLat &&
          post.lat <= maxLat &&
          post.lng >= minLng &&
          post.lng <= maxLng,
      )
      .sort((a, b) =>
        a.eventDate < b.eventDate ? 1 : a.eventDate > b.eventDate ? -1 : 0,
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

  createPost(createPostDto: CreatePostDto): Post {
    const {
      title,
      content,
      templateType,
      eventDate,
      address,
      lat,
      lng,
      imageUrl,
      tags,
    } = createPostDto;
    const newPost: Post = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      eventDate,
      templateType,
      title,
      content,
      address: address ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      imageUrl,
      tags,
    };

    this.posts.push(newPost);
    return newPost;
  }

  private createSeedPosts(): Post[] {
    // 서울 시청 근처를 중심으로 한 몇 개의 더미 데이터
    const baseLat = 37.5665;
    const baseLng = 126.978;

    const makePost = (overrides: Partial<Post>): Post => {
      const id = overrides.id ?? crypto.randomUUID();
      const createdAt = overrides.createdAt ?? new Date().toISOString();
      const eventDate = overrides.eventDate ?? createdAt;

      const generatedImageUrl = faker.image.urlPicsumPhotos({
        width: 400,
        height: 400,
      });
      const imageUrl = overrides.imageUrl ?? generatedImageUrl;

      return {
        id,
        // overrides로 들어오는 제목/템플릿/주소 등은 기본값보다 우선 적용
        ...overrides,
        title: overrides.title ?? '제목 없는 일기',
        templateType: overrides.templateType ?? 'diary',
        address: overrides.address ?? '서울특별시 중구 세종대로 110',
        lat: overrides.lat ?? baseLat,
        lng: overrides.lng ?? baseLng,
        content:
          overrides.content ??
          '이것은 인메모리 더미 게시글입니다. 실제 데이터베이스 연동 전까지는 서버 메모리에서만 관리됩니다.',
        createdAt,
        eventDate,
        imageUrl,
      };
    };

    return [
      makePost({
        title: '광화문 근처 카페',
        address: '서울특별시 종로구 사직로 161 (경복궁 인근)',
        eventDate: '2025-12-07T09:00:00+09:00',
        lat: baseLat + 0.005,
        lng: baseLng + 0.003,
        content: '광화문 근처 카페에서 커피를 마셨다.',
      }),
      makePost({
        title: '을지로 맛집 탐방',
        templateType: 'travel',
        address: '서울특별시 영등포구 여의대로 24',
        eventDate: '2025-12-13T18:00:00+09:00',
        lat: baseLat - 0.004,
        lng: baseLng + 0.006,
        content: '을지로 골목골목을 돌아다니며 맛집을 방문했다.',
      }),
      makePost({
        title: '한강 야경 산책',
        templateType: 'etc',
        address: '서울특별시 영등포구 여의도동',
        eventDate: '2025-12-10T20:00:00+09:00',
        lat: baseLat - 0.02,
        lng: baseLng - 0.02,
        content: '여의도 한강공원에서 야경을 보며 산책했다.',
      }),
    ];
  }
}
