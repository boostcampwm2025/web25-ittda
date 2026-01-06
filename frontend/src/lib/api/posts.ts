import type { PostListItem } from '../types/record';
import type { CreatePostRequest } from '../types/record';
import {
  serverComponentApiPrefix,
  clientComponentNestApiPrefix,
} from './api_prefix';

export function getApiPrefix(isServerComponent: boolean) {
  if (isServerComponent) {
    return serverComponentApiPrefix;
  } else {
    return clientComponentNestApiPrefix;
  }
}

// TODO: API_PREFIX를 상황에 맞게 설정 후 아래 fetchPostsByBbox 등에 인자로 넣어주세요!
const API_PREFIX = getApiPrefix(true); // TODO: 폐기 예정

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
      templateType: body.templateType ?? 'diary',
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}
