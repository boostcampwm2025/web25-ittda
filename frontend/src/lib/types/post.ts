export type TemplateType =
  | 'diary'
  | 'travel'
  | 'movie'
  | 'musical'
  | 'theater'
  | 'memo'
  | 'etc';

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
