'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  const isAdmin = pathname.includes('/admin');
  const isGroupChat = pathname.includes('/chat');
  const isGroupDetail = /\/group\/[^/]+\/(post|draft)\//.test(pathname);
  const minimalPaths = [
    '/add',
    '/search',
    '/search/media',
    '/profile/edit',
    '/profile/all-tags',
    '/profile/all-emotions',
    '/location-picker',
    '/invite',
    '/onboarding',
    '/announcements',
  ];
  const isDetail =
    pathname.includes('/record/') ||
    pathname.includes('/detail/') ||
    pathname.includes('/month/') ||
    pathname.includes('/edit') ||
    pathname.includes('/share');

  const isLogin =
    pathname.includes('/login') || pathname.includes('/oauth/callback');
  const isProfile = pathname === '/profile';
  const isMap = pathname.includes('/map');
  const showHeader =
    !isLogin &&
    !minimalPaths.includes(pathname) &&
    !isDetail &&
    !isGroupChat &&
    !isProfile &&
    !isMap &&
    !isGroupDetail &&
    !isAdmin;

  if (!showHeader) return null;

  return <Header />;
}
