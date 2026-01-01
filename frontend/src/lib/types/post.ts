export type TemplateType =
  | 'diary'
  | 'travel'
  | 'movie'
  | 'musical'
  | 'theater'
  | 'memo'
  | 'etc';

export type FieldType =
  | 'emotion'
  | 'photos'
  | 'location'
  | 'rating'
  | 'content'
  | 'tags'
  | 'table'
  | 'date'
  | 'time'
  | 'media';

export interface CustomField {
  id: string;
  type:
    | 'tag'
    | 'location'
    | 'rating'
    | 'emotion'
    | 'media_info'
    | 'image'
    | 'table';
  label: string;
  value: unknown;
}

export interface MemoryRecord {
  id: string;
  title: string;
  createdAt: number;
  customFields: CustomField[];
  groupId?: string;
  // 유저가 설정한 필드 배치 순서
  fieldOrder: FieldType[];
  // 각 필드별 실제 데이터
  data: {
    date: string;
    time: string;
    content: string;
    photos: string[];
    emotion: { emoji: string; label: string } | null;
    tags: string[];
    location: string | null;
    rating: { value: number; max: number };
    media: { image: string; type: string; title: string } | null;
    table: string[][] | null; // 행과 열 데이터
  };
}

export interface MonthRecord {
  id: string;
  name: string;
  count: number;
  latestTitle: string;
  latestLocation: string;
  coverUrl: string | null;
}

export interface PostListItem {
  id: string;
  title: string;
  templateType: TemplateType;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  eventDate: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
}

export interface CreatePostRequest {
  templateType?: TemplateType; // 기본값 'diary'
  title: string;
  content: string;
  eventDate: string;
  address?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  tags?: string[];
}
