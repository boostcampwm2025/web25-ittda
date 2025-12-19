import type { PostListItem } from '../types/post';
import type { CreatePostRequest } from '../types/post';

const API_PREFIX = '/api';

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
  const res = await fetch(`${API_PREFIX}/posts?bbox=${bboxStr}&limit=50`);
  if (!res.ok) throw new Error(`Failed to fetch posts: ${res.status}`);
  return res.json();
}

// API 응답 타입 정의
export interface PostListResponse {
  meta: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
  items: PostListItem[];
}

// API 호출 함수
export async function fetchPostList(
  page = 1,
  limit = 10,
): Promise<PostListResponse> {
  const res = await fetch(
    `${API_PREFIX}/posts/list?page=${page}&limit=${limit}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch post list: ${res.status}`);
  }

  return res.json();
}

export async function fetchPostById(postId: string): Promise<PostListItem> {
  const res = await fetch(`${API_PREFIX}/posts/${postId}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status}`);
  }

  return res.json();
}

export async function createPost(body: CreatePostRequest) {
  const res = await fetch(`${API_PREFIX}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateType: body.templateType?? 'diary',
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}
