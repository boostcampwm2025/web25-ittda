'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NavItem from './NavItem';
import GroupSelectDrawer from './GroupSelectDrawer';
import {
  Book,
  HomeIcon,
  MapIcon,
  MessageSquare,
  Plus,
  Users,
  XCircle,
} from 'lucide-react';
import { AddRecordDrawer } from '@/app/(post)/group/_components/AddRecordDrawer';

// TODO: 실제 API에서 그룹 목록을 가져오도록 수정 (tanstack query 캐싱 사용)
const mockGroups = [
  {
    id: 'g1',
    name: '우리 가족 추억함',
    members: 4,
    coverUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'g2',
    name: '성수동 맛집 탐방대',
    members: 3,
    coverUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false); // 그룹 상세용 기록 방식 선택

  const isSharedPage = pathname === '/shared';
  const isGroupDetail = /\/group\/[^/]+\/(post|draft)\//.test(pathname);

  const minimalPaths = [
    '/add',
    '/search',
    '/search/media',
    '/profile/edit',
    '/location-picker',
    '/invite',
    '/onboarding',
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
  if (isGroupDetail) return null;

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
            onClick={() => setIsAddDrawerOpen(true)}
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
            onClick={() => {
              if (isSharedPage) {
                setIsGroupSelectOpen(true);
              } else {
                router.push('/add');
              }
            }}
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

      <GroupSelectDrawer
        open={isGroupSelectOpen}
        onOpenChange={setIsGroupSelectOpen}
        groups={mockGroups}
      />
      <AddRecordDrawer
        isOpen={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        groupId={pathGroupId ?? undefined}
      />
    </nav>
  );
}
