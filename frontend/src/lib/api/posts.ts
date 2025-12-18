import type { PostListItem, RecordListItem } from '../types/post';

export interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface PostsByBboxResponse {
  meta: { bbox: Bbox; count: number };
  items: PostListItem[];
}

export async function fetchPostsByBbox(
  bbox: Bbox,
): Promise<PostsByBboxResponse> {
  const bboxStr = `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`;
  const res = await fetch(`/posts?bbox=${bboxStr}&limit=50`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

// API 응답 타입 정의
export interface RecordListResponse {
  meta: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
  items: RecordListItem[];
}

// API 호출 함수
export async function fetchRecordList(
  page = 1,
  limit = 10,
): Promise<RecordListResponse> {
  const res = await fetch(`/posts/list?page=${page}&limit=${limit}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch record list: ${res.status}`);
  }

  return res.json();
}
