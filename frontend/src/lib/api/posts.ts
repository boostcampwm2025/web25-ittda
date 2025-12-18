import type { PostListItem } from "../types/post"; 

export interface Bbox  {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export interface PostsByBboxResponse {
  meta: { bbox: Bbox; count: number }; 
  items: PostListItem[];
};

export async function fetchPostsByBbox(bbox: Bbox): Promise<PostsByBboxResponse> {  
  const bboxStr = `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;
  const res = await fetch(`/posts?bbox=${bboxStr}&limit=50`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}
