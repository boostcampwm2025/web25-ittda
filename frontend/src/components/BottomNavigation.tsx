'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/', icon: '/icons/home.svg', alt: '홈', label: '홈' },
  {
    href: '/111/record-map',
    icon: '/icons/location-on.svg',
    alt: '지도',
    label: '지도',
  },
  {
    href: '/records',
    icon: '/icons/post.svg',
    alt: '나의기록',
    label: '나의 기록',
  },
  {
    href: '/calendar',
    icon: '/icons/calendar.svg',
    alt: '캘린더',
    label: '캘린더',
  },
  {
    href: '/group',
    icon: '/icons/group.svg',
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
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 min-w-[60px]"
            >
              <div
                className={`w-6 h-6 flex items-center justify-center ${
                  item.isProfile ? 'rounded-full overflow-hidden' : ''
                }`}
              >
                {isActive ? (
                  <Image
                    src={item.icon}
                    alt={item.alt}
                    width={24}
                    height={24}
                    className={`${item.isProfile ? 'w-full h-full object-cover' : 'w-6 h-6'}`}
                  />
                ) : (
                  <Image
                    src={item.icon}
                    alt={item.alt}
                    width={24}
                    height={24}
                    className={`${item.isProfile ? 'w-full h-full object-cover' : 'w-6 h-6'}`}
                  />
                )}
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
