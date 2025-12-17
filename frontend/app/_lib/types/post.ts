export type TemplateType = "diary" | "travel" | "movie" | "musical" | "theater" | "memo" | "etc";

export type PostListItem = {
  id: string;
  title: string;
  templateType: TemplateType;
  lat: number;
  lng: number;
  createdAt: string;
  preview: string;
};