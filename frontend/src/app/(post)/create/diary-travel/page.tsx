'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/date';
import Image from 'next/image';
import Tag from '@/components/TagButton';
import { Button } from '@/components/ui/button';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['hello']);
  const [currentTag, setCurrentTag] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousHeightRef = useRef<number>(0);

  // 자동으로 textarea 높이 조절 및 스크롤
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const previousHeight = previousHeightRef.current;

      textarea.style.height = 'auto';
      const newHeight = textarea.scrollHeight;
      textarea.style.height = `${newHeight}px`;

      // 이전 높이가 기록되어 있고, 높이가 변경되었을 때 스크롤
      if (previousHeight > 0 && newHeight !== previousHeight) {
        const heightDifference = newHeight - previousHeight;
        window.scrollBy({ top: heightDifference, behavior: 'smooth' });
      }

      previousHeightRef.current = newHeight;
    }
  }, [content]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    // TODO: 게시글 저장 로직
    // console.log({ title, content, tags });
  };

  return (
    <main className="w-full max-w-4xl mx-auto px-6 py-8">
      {/* 날짜 표시 */}
      <div className="mb-2.75">
        <time className="text-lg font-semibold text-itta-black flex justify-start items-center gap-1.25">
          {formatDate()}
          <ChevronDown color="var(--itta-black)" />
        </time>

        <div className="flex justify-start items-center gap-6.5 text-md text-itta-black mt-1 font-medium">
          {formatTime()}
          <div className="flex justify-start items-center gap-1.25">
            <Image
              src={'/icons/location-on-fill-point.svg'}
              alt={'위치 선택 아이콘'}
              width={16}
              height={16}
              className="w-5 h-5"
            />
            <div className="flex justify-start items-center gap-4.5">
              <address className="not-italic truncate max-w-44 overflow-hidden">
                광주광역시 광산구 어딘가의 위치
              </address>
              <X className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-l border-itta-gray2 w-full px-6 py-3.5 mt-2.5">
        {/* 제목 입력 */}
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold text-itta-black placeholder:text-itta-gray3/60 border-none outline-none mb-4"
        />

        {/* 본문 입력 - 자동 높이 조절 */}
        <textarea
          ref={textareaRef}
          placeholder="이곳에서 당신이 느낀 모든 것을 남겨보세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full text-md text-itta-black placeholder:text-itta-gray3/60 placeholder:font-semibold border-none outline-none resize-none min-h-[200px] leading-relaxed font-medium"
        />

        {/* 태그 입력 */}
        <div className="flex justify-start items-center w-full gap-1.25 mt-3">
          <Tag onClick={() => {}}>
            <span className="text-itta-point">#</span> 태그 추가
          </Tag>
          <div className="flex justify-start items-center gap-1.25">
            {tags.map((tag) => (
              <Tag key={tag} className="hover:bg-transparent cursor-default">
                <span className="text-itta-point">#</span> {tag}
              </Tag>
            ))}
          </div>
        </div>

        {/* 이미지 추가 영역 (선택사항) */}
        <div className="pb-3.75 pt-6 border-itta-gray2 flex justify-start items-center gap-2.25">
          <Image
            src={'/icons/camera.svg'}
            alt={'카메라'}
            width={16}
            height={16}
            className="w-7.5 h-7.5"
          />
          <span className="font-medium">이미지 추가</span>
        </div>

        {/* 추가된 이미지 */}
        <div className="flex justify-start items-center gap-3.75">
          <Image
            src={'/profile-ex.jpeg'}
            alt="추가한"
            width={200}
            height={200}
            className="object-cover w-[200px] h-[200px]"
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <Button className="w-full mt-13" onClick={handleSubmit}>
        저장하기
      </Button>
    </main>
  );
}
