import { NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    service = new PostService();
  });

  it('should paginate posts by page and limit', () => {
    const firstPage = service.findPaginated(1, 1);
    const secondPage = service.findPaginated(2, 1);

    expect(firstPage.totalCount).toBeGreaterThan(1);
    expect(firstPage.items.length).toBeLessThanOrEqual(1);
    expect(secondPage.items.length).toBeLessThanOrEqual(1);
    // 첫 페이지와 두 번째 페이지의 게시글이 다를 가능성이 높다
    if (firstPage.items[0] && secondPage.items[0]) {
      expect(firstPage.items[0].id).not.toBe(secondPage.items[0].id);
    }
  });

  it('should return posts within given bbox', () => {
    const bbox = {
      minLat: 37.3,
      minLng: 126.7,
      maxLat: 37.8,
      maxLng: 127.3,
    };

    const posts = service.findByBbox(bbox, 50);

    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.lat).toBeGreaterThanOrEqual(bbox.minLat);
      expect(post.lat).toBeLessThanOrEqual(bbox.maxLat);
      expect(post.lng).toBeGreaterThanOrEqual(bbox.minLng);
      expect(post.lng).toBeLessThanOrEqual(bbox.maxLng);
    }
  });

  it('should respect limit parameter', () => {
    const bbox = {
      minLat: 37.3,
      minLng: 126.7,
      maxLat: 37.8,
      maxLng: 127.3,
    };

    const posts = service.findByBbox(bbox, 1);

    expect(posts.length).toBeLessThanOrEqual(1);
  });

  it('should find a post by id', () => {
    const bbox = {
      minLat: 37.3,
      minLng: 126.7,
      maxLat: 37.8,
      maxLng: 127.3,
    };
    const [first] = service.findByBbox(bbox, 1);

    expect(first).toBeDefined();

    const found = service.findOne(first.id);

    expect(found).toBeDefined();
    expect(found.id).toBe(first.id);
  });

  it('should throw NotFoundException when post does not exist', () => {
    expect(() => service.findOne('non-existent-id')).toThrow(NotFoundException);
  });
});
