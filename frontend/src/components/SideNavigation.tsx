'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const navigationItems = [
  { href: '/', icon: '/icons/home.svg', alt: '홈', label: '홈' },
  {
    href: '/111/record-map',
    icon: '/icons/location-on.svg',
    alt: '지도',
    label: '지도',
  },
  { href: '/', icon: '/icons/post.svg', alt: '나의기록', label: '나의기록' },
  { href: '/', icon: '/icons/calendar.svg', alt: '캘린더', label: '캘린더' },
  { href: '/', icon: '/icons/group.svg', alt: '함께기록', label: '함께기록' },
];

export default function SideNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Left Edge Trigger Area - Invisible */}
      <div
        className="absolute left-0 top-0 w-4 h-full z-30"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Hint Tab - Always Visible */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 z-40"
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className="w-2 h-20 bg-linear-to-b from-itta-black to-itta-black/80 rounded-r-full shadow-sm hover:w-2 transition-all duration-300" />
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-itta-gray2 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`absolute left-0 top-0 h-full w-[230px] bg-white border-r border-[#f0ebe3] z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="w-full flex items-center gap-3 py-3 text-itta-black hover:bg-itta-gray1/20 rounded-xl transition-colors"
            >
              <Image
                src={item.icon}
                alt={item.alt}
                width={120}
                height={120}
                className="w-8.5 h-8.5"
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
