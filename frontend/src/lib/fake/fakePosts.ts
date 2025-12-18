import { faker } from '@faker-js/faker';
import type { TemplateType, PostListItem } from '@/lib/types/post';

const KOREA = {
  minLat: 33.0,
  maxLat: 38.8,
  minLng: 124.5,
  maxLng: 132.0,
} as const;

const SEOUL_REGIONS = [
  '서울특별시 종로구',
  '서울특별시 중구',
  '서울특별시 용산구',
  '서울특별시 성동구',
  '서울특별시 광진구',
  '서울특별시 동대문구',
  '서울특별시 중랑구',
  '서울특별시 성북구',
  '서울특별시 강북구',
  '서울특별시 도봉구',
  '서울특별시 노원구',
  '서울특별시 은평구',
  '서울특별시 서대문구',
  '서울특별시 마포구',
  '서울특별시 양천구',
  '서울특별시 강서구',
  '서울특별시 구로구',
  '서울특별시 금천구',
  '서울특별시 영등포구',
  '서울특별시 동작구',
  '서울특별시 관악구',
  '서울특별시 서초구',
  '서울특별시 강남구',
  '서울특별시 송파구',
  '서울특별시 강동구',
];

function randIn(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomTemplate(): TemplateType {
  const list: TemplateType[] = [
    'diary',
    'travel',
    'movie',
    'musical',
    'theater',
    'memo',
    'etc',
  ];
  return list[Math.floor(Math.random() * list.length)];
}

function randomSeoulAddress() {
  const region =
    SEOUL_REGIONS[Math.floor(Math.random() * SEOUL_REGIONS.length)];
  const detail = faker.location.streetAddress();
  return `${region} ${detail}`;
}

export function makeFakePosts(count = 2000): PostListItem[] {
  return Array.from({ length: count }, () => {
    const id = faker.string.uuid();
    const templateType = randomTemplate();

    const lat = Number(randIn(KOREA.minLat, KOREA.maxLat).toFixed(6));
    const lng = Number(randIn(KOREA.minLng, KOREA.maxLng).toFixed(6));

    const title = faker.lorem.words({ min: 2, max: 5 });
    const createdAt = faker.date.recent({ days: 30 }).toISOString();

    const content = faker.lorem.paragraphs({ min: 2, max: 5 }, '\n\n');
    const address = randomSeoulAddress();

    const imageUrl = faker.image.urlPicsumPhotos({ width: 400, height: 400 });

    return {
      id,
      title,
      templateType,
      address,
      lat,
      lng,
      createdAt,
      content,
      imageUrl,
    };
  });
}

export function filterByBbox<T extends { lat: number; lng: number }>(
  items: T[],
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
) {
  return items.filter(
    (p) =>
      p.lat >= bbox.minLat &&
      p.lat <= bbox.maxLat &&
      p.lng >= bbox.minLng &&
      p.lng <= bbox.maxLng,
  );
}

// 템플릿 타입에 따른 가짜 태그 생성
function getTagsByTemplate(type: TemplateType): string[] {
  const tagMap: Record<TemplateType, string[]> = {
    diary: ['일상', '기록', '생각'],
    travel: ['여행', '휴가', '힐링'],
    movie: ['영화', '문화생활', '팝콘'],
    musical: ['뮤지컬', '공연', '커튼콜'],
    theater: ['연극', '대학로', '배우'],
    memo: ['메모', '아이디어', '중요'],
    etc: ['기타', '일상'],
  };
  return tagMap[type] || ['태그'];
}

export function makeFakeRecordList(count = 50) {
  return Array.from({ length: count }, () => {
    const id = faker.string.uuid();
    const templateType = randomTemplate();
    const title = faker.lorem.words({ min: 2, max: 5 });

    // 최근 30일 내 데이터
    const createdAt = faker.date.recent({ days: 30 }).toISOString();

    const content = faker.lorem.paragraphs({ min: 1, max: 3 }, '\n\n');
    const address = randomSeoulAddress();
    const tags = getTagsByTemplate(templateType);

    // 더미 이미지 (public 폴더에 있는 이미지 혹은 외부 URL)
    const images = Math.random() > 0.3 ? ['/profile-ex.jpeg'] : [];

    return {
      id,
      title,
      templateType,
      address,
      createdAt,
      content,
      images,
      tags,
    };
  });
}
