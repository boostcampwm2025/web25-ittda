'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  const isGroupChat = pathname.includes('/chat');

  const minimalPaths = [
    '/add',
    '/search',
    '/search/media',
    '/profile/edit',
    '/profile/all-tags',
    '/profile/all-emotions',
  ];
  const isDetail =
    pathname.includes('/record/') ||
    pathname.includes('/detail/') ||
    pathname.includes('/month/') ||
    pathname.includes('/edit');

  const isLogin = pathname.includes('/login');
  const isProfile = pathname === '/profile';
  const isMap = pathname.includes('/map');
  const showHeader =
    !isLogin &&
    !minimalPaths.includes(pathname) &&
    !isDetail &&
    !isGroupChat &&
    !isProfile &&
    !isMap;

  if (!showHeader) return null;

  return <Header />;
}
