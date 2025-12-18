import { NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    service = new PostService();
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
