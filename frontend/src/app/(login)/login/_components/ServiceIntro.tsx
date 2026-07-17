'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Camera,
  Palette,
  Users,
  MapPin,
  BarChart3,
  Book,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  icon: LucideIcon;
  headline: string;
  description: string;
  image: string;
  caption: string;
}

// 무채색(검정~흰색)만으로 섹션 대비를 준다 — 진한 톤 사이에 밝은 톤을 하나 끼워 리듬을 준다
const SECTION_BG = [
  'bg-neutral-950',
  'bg-neutral-900',
  'bg-white',
  'bg-neutral-900',
  'bg-neutral-950',
] as const;

const FEATURE_DATA: FeatureItem[] = [
  {
    icon: Camera,
    headline: '사진만으로\n완성되는 타임라인',
    description: '사진 속 날짜와 장소를 불러와\n기록의 수고를 덜어드려요',
    image: '/feature-photo-timeline.png',
    caption: '사진 메타데이터 자동 인식',
  },
  {
    icon: Palette,
    headline: '나만의 스타일로\n완성하는 오늘의 기록',
    description: '평점, 감정, 표 등으로\n개성 있는 일기를 만들어 보세요',
    image: '/feature-custom-style.png',
    caption: '나만의 스타일로 완성하는 오늘의 기록',
  },
  {
    icon: Users,
    headline: '로그인 없이도 친구와\n함께 쓰는 실시간 기록',
    description: '계정 없는 친구도 게스트 초대로\n우리만의 추억을 공유하세요',
    image: '/feature-realtime-friends.png',
    caption: '친구와 함께 하는 실시간 기록',
  },
  {
    icon: MapPin,
    headline: '지도 위에 펼쳐지는\n우리들의 추억 지도',
    description: '소중한 장소들을\n지도에서 다시 만나보세요',
    image: '/feature-memory-map.png',
    caption: '우리들의 추억 지도',
  },
  {
    icon: BarChart3,
    headline: '숫자로 마주하는\n우리들의 소중한 발자취',
    description: '이번 달 기록 횟수부터\n장소, 감정까지 통계로 확인하세요',
    image: '/feature-record-stats.png',
    caption: '나의 소중한 기록들',
  },
];

export default function ServiceIntro() {
  return (
    <section className="w-full bg-white">
      {/* 기능 소개: 섹션마다 진한 컬러 배경으로 대비를 주고, 좌우 배치는 번갈아 바뀜 */}
      {FEATURE_DATA.map((item, i) => {
        const imageOnLeft = i % 2 === 1;
        const isLight = SECTION_BG[i] === 'bg-white';
        return (
          <div
            key={item.headline}
            className={cn('relative w-full overflow-hidden', SECTION_BG[i])}
          >
            <motion.div
              initial={{ opacity: 0, y: 56, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={cn(
                'relative mx-auto max-w-4xl flex flex-col items-center gap-10 lg:gap-16 px-6 py-16 lg:py-24 text-center',
                imageOnLeft ? 'lg:flex-row-reverse' : 'lg:flex-row',
              )}
            >
              <div
                className={cn(
                  'flex-1 min-w-0 flex flex-col items-center',
                  imageOnLeft
                    ? 'lg:items-end lg:text-right'
                    : 'lg:items-start lg:text-left',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-11 h-11 rounded-full border mb-5',
                    isLight
                      ? 'bg-gray-100 border-gray-200 text-itta-black'
                      : 'bg-white/10 border-white/15 text-white',
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </span>
                <p className="text-lg lg:text-xl font-bold mb-2 text-itta-point">
                  {item.caption}
                </p>
                <h3
                  className={cn(
                    'text-[26px] lg:text-4xl font-bold leading-[1.35] whitespace-pre-line mb-4',
                    isLight ? 'text-itta-black' : 'text-white',
                  )}
                >
                  {item.headline}
                </h3>
                <p
                  className={cn(
                    'text-base lg:text-lg leading-relaxed whitespace-pre-line',
                    isLight ? 'text-gray-500' : 'text-white/60',
                  )}
                >
                  {item.description}
                </p>
              </div>

              <div className="w-full max-w-65 lg:max-w-80 shrink-0">
                <Image
                  src={item.image}
                  alt={item.caption}
                  width={512}
                  height={1001}
                  sizes="(min-width: 1024px) 320px, 260px"
                  className="w-full h-auto object-contain"
                />
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* 보관함: 진한 섹션들 사이에서 숨 고르는 밝은 마무리 섹션 */}
      <div className="relative w-full overflow-hidden bg-white">
        <motion.div
          initial={{ opacity: 0, y: 56, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative mx-auto max-w-2xl flex flex-col items-center text-center px-6 py-20 lg:py-28"
        >
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 text-itta-black mb-5">
            <Book className="w-5 h-5" />
          </span>
          <p className="text-lg lg:text-xl font-bold text-itta-point mb-2">
            보관함
          </p>
          <h3 className="text-[26px] lg:text-4xl font-bold leading-[1.35] mb-4 text-itta-black">
            그룹마다 따로,
            <br />또 같이 쌓이는 우리의 기록
          </h3>
          <p className="text-base lg:text-lg leading-relaxed text-gray-500">
            가족 여행부터 친구들과의 일상까지
            <br />
            그룹별로 나누어 보관함에 기록해요
          </p>
        </motion.div>
      </div>
    </section>
  );
}
