'use client';

import Searchbar from '@/components/Searchbar';
import TagButton from '@/components/TagButton';
import SimpleMemo from './SimpleMemo';

export default function SideFilterbar() {
  return (
    <div className="min-w-0 w-full h-full flex flex-col">
      <div className="h-full">
        <Searchbar placeholder="로그 검색하기" onCalendarClick={() => {}} />
        <div className="flex gap-2.5 mt-7 flex-wrap">
          <TagButton onClick={() => {}}>연극</TagButton>
          <TagButton onClick={() => {}}>뮤지컬</TagButton>
          <TagButton onClick={() => {}}>일기/여행</TagButton>
          <TagButton onClick={() => {}}>영화</TagButton>
          <TagButton onClick={() => {}}>기타</TagButton>
        </div>
      </div>

      <div className="pb-3.5 min-w-0">
        <SimpleMemo />
      </div>
    </div>
  );
}
