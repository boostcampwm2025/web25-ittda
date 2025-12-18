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
  createdAt: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
}

export interface CreatePostDto {
  title: string;
  content: string;
  templateType: TemplateType;
  address?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  tags?: string[];
}
