'use client';

import Searchbar from '@/components/Searchbar';
import TagButton from '@/components/TagButton';

export default function SideFilterbar() {
  return (
    <div>
      <Searchbar placeholder="로그 검색하기" onCalendarClick={() => {}} />
      <div className="flex gap-2.5 mt-7 flex-wrap">
        <TagButton onClick={() => {}}>연극</TagButton>
        <TagButton onClick={() => {}}>뮤지컬</TagButton>
        <TagButton onClick={() => {}}>일기/여행</TagButton>
        <TagButton onClick={() => {}}>영화</TagButton>
        <TagButton onClick={() => {}}>기타</TagButton>
      </div>
    </div>
  );
}
