'use client';

import { usePathname, useRouter } from 'next/navigation';
import NavItem from './NavItem';
import {
  Book,
  HomeIcon,
  MapIcon,
  MessageSquare,
  Plus,
  Users,
  XCircle,
} from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const minimalPaths = [
    '/add',
    '/search',
    '/search/media',
    '/profile/edit',
    '/location-picker',
  ];
  const isDetail =
    pathname.includes('/record/') ||
    pathname.includes('/detail/') ||
    pathname.includes('/month/') ||
    pathname.includes('/edit');
  const isGroupChat = pathname.includes('/chat');
  const isLogin =
    pathname.includes('/login') || pathname.includes('/oauth/callback');

  const showNav =
    !minimalPaths.includes(pathname) && !isDetail && !isGroupChat && !isLogin;

  const groupMatch = pathname.match(/\/group\/([^/]+)/);
  const pathGroupId = groupMatch ? groupMatch[1] : null;

  if (!showNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto px-8 py-4 pb-6 flex items-center justify-between z-50 backdrop-blur-xl border-t transition-all duration-300 dark:bg-[#121212]/90 dark:border-white/5 bg-white/90 border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
      {pathGroupId ? (
        <>
          <NavItem
            icon={<Book />}
            active={pathname === `/group/${pathGroupId}`}
            onClick={() => router.push(`/group/${pathGroupId}`)}
            isGroup
          />
          <NavItem
            icon={<MapIcon />}
            active={pathname === `/group/${pathGroupId}/map`}
            onClick={() => router.push(`/group/${pathGroupId}/map`)}
            isGroup
          />
          <button
            onClick={() => router.push(`/add?groupId=${pathGroupId}`)}
            className="cursor-pointer w-14 h-14 -mt-10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all ring-4 dark:bg-white dark:text-[#121212] dark:ring-[#121212] bg-[#222222] text-white ring-white"
          >
            <Plus className="w-7 h-7" strokeWidth={3} />
          </button>
          <NavItem
            icon={<MessageSquare />}
            active={pathname === `/group/${pathGroupId}/chat`}
            onClick={() => router.push(`/group/${pathGroupId}/chat`)}
            isGroup
          />
          <NavItem
            icon={<XCircle />}
            active={false}
            onClick={() => router.push('/shared')}
          />
        </>
      ) : (
        <>
          <NavItem
            icon={<HomeIcon />}
            active={pathname === '/'}
            onClick={() => router.push('/')}
          />
          <NavItem
            icon={<Book />}
            active={pathname.startsWith('/my')}
            onClick={() => router.push('/my')}
          />
          <button
            onClick={() => router.push('/add')}
            className="w-14 h-14 -mt-10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all ring-4 dark:bg-white dark:text-[#121212] dark:ring-[#121212] bg-[#222222] text-white ring-white"
          >
            <Plus className="w-7 h-7" strokeWidth={3} />
          </button>
          <NavItem
            icon={<Users />}
            active={pathname === '/shared'}
            onClick={() => router.push('/shared')}
          />
          <NavItem
            icon={<MapIcon />}
            active={pathname === '/map'}
            onClick={() => router.push('/map')}
          />
        </>
      )}
    </nav>
  );
}
