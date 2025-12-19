'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const userId = '111'; // 임시 유저 ID, 추후 인증 로직과 연동 필요

const navigationItems = [
  {
    href: '/',
    icon: '/icons/home.svg',
    iconFill: '/icons/home-fill.svg',
    alt: '홈',
    label: '홈',
  },
  {
    href: `/${userId}/record-map`,
    icon: '/icons/location-on.svg',
    iconFill: '/icons/location-on-fill.svg',
    alt: '지도',
    label: '지도',
  },
  {
    href: `/${userId}/records`,
    icon: '/icons/post.svg',
    iconFill: '/icons/post-fill.svg',
    alt: '나의기록',
    label: '나의 기록',
  },
  {
    href: '/calendar',
    icon: '/icons/calendar.svg',
    iconFill: '/icons/calendar-fill.svg',
    alt: '캘린더',
    label: '캘린더',
  },
  {
    href: '/group',
    icon: '/icons/group.svg',
    iconFill: '/icons/group-fill.svg',
    alt: '함께기록',
    label: '함께 기록',
  },
  {
    href: '/profile',
    icon: '/profile-ex.jpeg',
    alt: '프로필',
    label: '프로필',
    isProfile: true,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-itta-gray2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around px-4 py-2">
        {navigationItems.map((item) => {
          // 활성 상태 체크 로직
          const isActive = (() => {
            // 홈은 정확히 일치해야 함
            if (item.href === '/') {
              return pathname === '/';
            }

            // 지도는 /[id]/record-map 패턴 체크
            if (item.href.includes('record-map')) {
              const pathSegments = pathname.split('/').filter(Boolean);
              // depth가 2이고 마지막 세그먼트가 record-map인 경우
              return pathSegments.length === 2 && pathSegments[1] === 'record-map';
            }

            // 나머지는 경로가 해당 href로 시작하는지 체크
            return pathname.startsWith(item.href);
          })();

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 min-w-[60px]"
            >
              <div
                className={cn(
                  'w-6 h-6 flex items-center justify-center',
                  item.isProfile && 'rounded-full overflow-hidden',
                )}
              >
                <Image
                  src={isActive && item.iconFill ? item.iconFill : item.icon}
                  alt={item.alt}
                  width={30}
                  height={30}
                  className={`${item.isProfile ? 'w-full h-full object-cover' : 'w-6 h-6'}`}
                />
              </div>
              <span className={`text-[10px] font-semibold text-itta-black`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
