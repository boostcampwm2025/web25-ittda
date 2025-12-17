'use client';

import Searchbar from '@/components/Searchbar';
import TagButton from '@/components/TagButton';
import SimpleMemo from './SimpleMemo';
import {
  Calendar,
  Clapperboard,
  Film,
  LineSquiggle,
  Music2,
} from 'lucide-react';

// const CATEGORIES = [
//   { id: 'all', label: '전체' },
//   { id: 'theater', label: '연극' },
//   { id: 'musical', label: '뮤지컬' },
//   { id: 'concert', label: '일기/여행' },
//   { id: 'movie', label: '영화' },
//   { id: 'etc', label: '기타' },
// ];

export default function SideFilterbar() {
  // const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="min-w-0 w-full h-full flex flex-col">
      <div className="h-full">
        <Searchbar placeholder="로그 검색하기" onCalendarClick={() => {}} />
        <div className="flex gap-2.5 mt-7 flex-wrap">
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Clapperboard
              size={16}
              color="var(--itta-point)"
              className="flex justify-center items-center gap-1"
            />
            연극
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Film size={16} color="var(--itta-point)" />
            연극
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Music2 size={16} color="var(--itta-point)" />
            뮤지컬
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Calendar size={16} color="var(--itta-point)" />
            일기/여행
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <Clapperboard size={16} color="var(--itta-point)" />
            영화
          </TagButton>
          <TagButton
            onClick={() => {}}
            className="flex justify-center items-center gap-1"
          >
            <LineSquiggle size={16} color="var(--itta-point)" />
            기타
          </TagButton>
          {/* {CATEGORIES.map((category) => (
            <TagButton
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={
                selectedCategory === category.id
                  ? 'bg-itta-point/80 text-white shadow-sm border-itta-point'
                  : 'hover:border-itta-point text-gray-700'
              }
            >
              {category.label}
            </TagButton>
          ))} */}
        </div>
      </div>

      <div className="pb-3.5 min-w-0">
        <SimpleMemo />
      </div>
    </div>
  );
}
