'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
    label: '나의기록',
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
    label: '함께기록',
  },
];

export default function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 사이드바 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Left Edge Trigger Area - Invisible */}
      <div
        className="hidden md:block fixed left-0 top-0 w-4 h-screen z-30"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Hint Tab - Always Visible */}
      <div
        className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-40"
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className="w-2 h-20 bg-linear-to-b from-itta-black to-itta-black/80 rounded-r-full shadow-sm hover:w-2 transition-all duration-300" />
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="hidden md:block fixed inset-0 bg-itta-gray2 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          'hidden md:block fixed left-0 top-0 h-screen w-57.5 bg-white border-r border-[#f0ebe3] shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] z-50 transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Header */}
        <div className="text-sm w-full p-6 pl-6.5 pt-13 ">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex gap-3.5 items-center justify-start"
          >
            <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden">
              <Image
                src={'/profile-ex.jpeg'}
                alt="프로필"
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            </div>
            <span>유저 닉네임</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-6 pl-6.5 space-y-2 text-sm">
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
                className="w-full flex items-center gap-3 py-3 text-itta-black hover:bg-itta-gray1/20 rounded-xl transition-colors"
              >
                <Image
                  src={isActive && item.iconFill ? item.iconFill : item.icon}
                  alt={item.alt}
                  width={120}
                  height={120}
                  className="w-8.5 h-8.5"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
