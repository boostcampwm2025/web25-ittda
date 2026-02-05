'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { useQuery } from '@tanstack/react-query';
import { groupListOptions, groupMyRoleOptions } from '@/lib/api/group';

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false); // 그룹 상세용 기록 방식 선택

  // effectiveGroupId 먼저 계산
  const groupMatch = pathname.match(/\/group\/([^/]+)/);
  const pathGroupId = groupMatch ? groupMatch[1] : null;
  const searchParamsGroupId = searchParams.get('groupId');
  const scope = searchParams.get('scope');
  const effectiveGroupId =
    pathGroupId || (scope === 'group' ? searchParamsGroupId : null);

  const { data: groups = [] } = useQuery({
    ...groupListOptions(),
    enabled: isGroupSelectOpen,
  });

  // 현재 그룹의 role 조회
  const { data: roleData } = useQuery({
    ...groupMyRoleOptions(effectiveGroupId!),
    enabled: !!effectiveGroupId,
  });

  const isSharedPage = pathname === '/shared';
  const isGroupDetail = /\/group\/[^/]+\/(post|draft)\//.test(pathname);

  // VIEWER 권한 확인
  const isViewer = roleData?.role === 'VIEWER';

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
    pathname.includes('/detail/') ||
    pathname.includes('/month/') ||
    pathname.includes('/edit');

  const isGroupChat = pathname.includes('/chat');
  const isLogin =
    pathname.includes('/login') || pathname.includes('/oauth/callback');

  const showNav =
    !minimalPaths.includes(pathname) && !isDetail && !isGroupChat && !isLogin;

  if (!showNav) return null;
  if (isGroupDetail) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto px-8 py-4 pb-6 flex items-center justify-between z-50 backdrop-blur-xl border-t transition-all duration-300 dark:bg-[#121212]/90 dark:border-white/5 bg-white/90 border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
      {effectiveGroupId ? (
        <>
          <NavItem
            icon={<Book />}
            active={pathname === `/group/${effectiveGroupId}`}
            onClick={() => router.push(`/group/${effectiveGroupId}`)}
            isGroup
          />
          <NavItem
            icon={<MapIcon />}
            active={pathname === `/group/${effectiveGroupId}/map`}
            onClick={() => router.push(`/group/${effectiveGroupId}/map`)}
            isGroup
          />
          <button
            onClick={() => !isViewer && setIsAddDrawerOpen(true)}
            disabled={isViewer}
            className={`w-14 h-14 -mt-10 rounded-2xl ring-white flex items-center justify-center shadow-2xl transition-all ring-4 ${
              isViewer
                ? 'opacity-50 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400 dark:ring-[#121212] bg-gray-400 text-gray-200'
                : 'cursor-pointer active:scale-95 dark:ring-[#121212] text-white bg-itta-point shadow-[#10b981/20]'
            }`}
          >
            <Plus className="w-7 h-7" strokeWidth={3} />
          </button>
          <NavItem
            icon={<MessageSquare />}
            active={pathname === `/group/${effectiveGroupId}/notifications`}
            onClick={() =>
              router.push(`/group/${effectiveGroupId}/notifications`)
            }
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
            className={`w-14 h-14 -mt-10 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all ring-4 ${
              isSharedPage
                ? 'dark:ring-[#121212] text-white bg-itta-point shadow-[#10b981/20] ring-white'
                : 'dark:bg-white dark:text-[#121212] dark:ring-[#121212] bg-[#222222] text-white ring-white'
            }`}
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
        groups={groups}
      />
      <AddRecordDrawer
        isOpen={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        groupId={effectiveGroupId ?? undefined}
      />
    </nav>
  );
}
