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
  lat?: number;
  lng?: number;
  createdAt: string;
  content: string;
  imageUrl?: string;
}

// lat,lng 가 없는 데이터 조회용
export interface RecordListItem {
  id: string;
  title: string;
  templateType: TemplateType;
  address: string;
  createdAt: string;
  content: string;
  images: string[];
  tags: string[];
}
