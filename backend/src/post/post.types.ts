export interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export type TemplateType =
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
  address: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string; // 서버 저장 시각
  eventDate: string; // 사용자가 지정한 날짜
  content: string;
  imageUrl?: string;
  tags?: string[];
}

export interface CreatePostDto {
  title: string;
  content: string;
  templateType: TemplateType;
  eventDate: string;
  address?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  tags?: string[];
}
