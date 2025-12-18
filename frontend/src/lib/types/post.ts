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
  content: string;
  imageUrl?: string;
}
