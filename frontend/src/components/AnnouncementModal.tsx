import { cookies } from 'next/headers';
import AnnouncementModalClient from './AnnouncementModalClient';
import { getCookieFromString } from '@/lib/utils/cookie';
import { serverFetch } from '@/lib/api/serverFetch';

export interface AnnouncementData {
  id: string;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
}

async function fetchActiveAnnouncement(): Promise<AnnouncementData | null> {
  try {
    const res = await serverFetch('/v1/announcements/active', { cache: 'no-store' });
    if (!res.ok) return null;
    const body = await res.json();
    const announcement = ('data' in body ? body.data : body) as AnnouncementData | null;
    if (!announcement?.id || !announcement.title?.trim()) return null;
    return announcement;
  } catch {
    return null;
  }
}

async function shouldShowAnnouncement(
  announcement: AnnouncementData,
): Promise<boolean> {
  try {
    const res = await serverFetch('/v1/me/settings', { cache: 'no-store' });
    if (res.ok) {
      const body = (await res.json()) as { data?: Record<string, unknown> };
      const settings = body.data ?? {};
      if (settings.dismissedAnnouncementId === announcement.id) return false;
    }
  } catch {
    // 설정 조회 실패 시 표시 (게스트 포함)
  }

  // 로그인 상태면 여기서 true 반환, 게스트면 쿠키 기반
  const cookieStore = await cookies();
  const allCookies = cookieStore.toString();
  const dismissed = getCookieFromString(allCookies, 'dismissed-announcement-id');
  if (dismissed === announcement.id) return false;

  return true;
}

export default async function AnnouncementModal() {
  const announcement = await fetchActiveAnnouncement();

  if (!announcement) return null;

  const show = await shouldShowAnnouncement(announcement);
  if (!show) return null;

  return <AnnouncementModalClient announcement={announcement} />;
}
