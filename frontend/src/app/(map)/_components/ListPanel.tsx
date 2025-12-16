'use client';

import DiaryPostShort from '@/components/DiaryPostShort';

interface ListPanelProps {
  onStartDrag: () => void;
}

export default function ListPanel({ onStartDrag }: ListPanelProps) {
  const dummyPosts = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="flex-col h-full w-full relative">
      <div className="flex flex-col h-full w-full overflow-y-auto">
        <div className="relative flex-1">
          {dummyPosts.map((_, index) => (
            <DiaryPostShort key={index} />
          ))}
          <div className="absolute left-5.75 top-8 w-[1.5px] bottom-0 bg-itta-gray2 pointer-events-none" />
        </div>
      </div>
      <div
        className="absolute right-0 w-2 h-10 bg-itta-black rounded-tl-md rounded-bl-md top-[50%] -translate-y-1/2 cursor-grab"
        onMouseDown={(e) => {
          e.preventDefault();
          onStartDrag();
        }}
      />
    </div>
  );
}
