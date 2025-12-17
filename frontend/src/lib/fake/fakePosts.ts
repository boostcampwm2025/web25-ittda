import { faker } from "@faker-js/faker";
import type { TemplateType, PostListItem } from "../../../lib/types/post";

export type PostDetail = PostListItem & {
  content: string;
};

const KOREA = {
  minLat: 33.0,
  maxLat: 38.8,
  minLng: 124.5,
  maxLng: 132.0,
} as const;

function randIn(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomTemplate(): TemplateType {
  const list: TemplateType[] = ["diary", "travel", "movie", "musical", "theater", "memo", "etc"];
  return list[Math.floor(Math.random() * list.length)];
}

export function makeFakePosts(count = 2000): PostDetail[] {
  return Array.from({ length: count }, () => {
    const id = faker.string.uuid();
    const templateType = randomTemplate();

    const lat = Number(randIn(KOREA.minLat, KOREA.maxLat).toFixed(6));
    const lng = Number(randIn(KOREA.minLng, KOREA.maxLng).toFixed(6));

    const title = faker.lorem.words({ min: 2, max: 5 });
    const createdAt = faker.date.recent({ days: 30 }).toISOString();

    const content = faker.lorem.paragraphs({ min: 2, max: 5 }, "\n\n");
    const preview = content.replace(/\s+/g, " ").slice(0, 60);

    return { id, title, templateType, lat, lng, createdAt, preview, content };
  });
}

export function filterByBbox<T extends { lat: number; lng: number }>(
  items: T[],
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number }
) {
  return items.filter(
    (p) =>
      p.lat >= bbox.minLat &&
      p.lat <= bbox.maxLat &&
      p.lng >= bbox.minLng &&
      p.lng <= bbox.maxLng
  );
}
