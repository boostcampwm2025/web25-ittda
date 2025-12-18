'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatTime } from '@/lib/date';
import Image from 'next/image';
import Tag from '@/components/TagButton';
import { Button } from '@/components/ui/button';
import { createPost } from '@/lib/api/posts';
import { useRouter } from 'next/navigation';
import { TimePicker } from '@/components/TimePicker';
import DatePicker from '@/components/DatePicker';

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>(['hello']);
  const [currentTag, setCurrentTag] = useState('');
  const [selectedTime, setSelectedTime] = useState(formatTime());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousHeightRef = useRef<number>(0);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultAddress = '광주광역시 광산구 어딘가';

  // 자동으로 textarea 높이 조절 및 스크롤
  useEffect(() => {
    if (textareaRef.current && mainContainerRef.current) {
      const textarea = textareaRef.current;
      const container = mainContainerRef.current;
      const previousHeight = previousHeightRef.current;

      // 현재 스크롤 위치 저장
      const currentScrollTop = container.scrollTop;

      textarea.style.height = 'auto';
      const newHeight = textarea.scrollHeight;
      textarea.style.height = `${newHeight}px`;

      // 높이가 증가했을 때만 스크롤 조정
      if (previousHeight > 0 && newHeight > previousHeight) {
        const heightDifference = newHeight - previousHeight;

        // textarea의 실제 화면상 위치 계산
        const textareaRect = textarea.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 모바일 BottomNavigation 높이 고려
        const isMobile = window.innerWidth < 768;
        const bottomNavHeight = isMobile ? 75 : 0;

        // 컨테이너의 실제 보이는 영역의 하단 (네비게이션바 제외)
        const visibleBottom = containerRect.bottom - bottomNavHeight;

        // textarea의 하단이 보이는 영역의 하단 근처(20px 이내)에 있을 때만 스크롤 조정
        const textareaBottom = textareaRect.bottom;
        const distanceFromVisibleBottom = textareaBottom - visibleBottom;

        if (
          distanceFromVisibleBottom >= -20 &&
          distanceFromVisibleBottom <= 20
        ) {
          container.scrollTop = currentScrollTop + heightDifference;
        }
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await createPost({
      title,
      content,
      templateType: 'diary',
      eventDate: new Date().toISOString(),
      address: defaultAddress,
      lat: 35.1395,
      lng: 126.853,
      tags,
    });

    // 작성이 완료되면 이전 화면으로 돌아가기
    router.back();
  };

  return (
    <>
      <main ref={mainContainerRef} className="w-full h-full overflow-y-auto">
        <div className="w-full px-6 py-8">
          {/* 날짜 표시 */}
          <div className="mb-2.75">
            <time className="text-lg font-semibold text-itta-black flex justify-start items-center gap-1.25">
              <DatePicker value={selectedDate} onChange={setSelectedDate} />
            </time>

            <div className="flex justify-start items-center gap-6.5 text-md text-itta-black mt-1 font-medium">
              <TimePicker value={selectedTime} onChange={setSelectedTime} />
              <div className="flex justify-start items-center gap-1.25">
                <Image
                  src={'/icons/location-on-fill-point.svg'}
                  alt={'위치 선택 아이콘'}
                  width={16}
                  height={16}
                  className="w-5 h-5"
                />
                <div className="flex justify-start items-center gap-4.5">
                  <button className="not-italic truncate max-w-44 overflow-hidden">
                    {defaultAddress}
                  </button>
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
              className="w-full text-md text-itta-black placeholder:text-itta-gray3/60 placeholder:font-semibold border-none outline-none resize-none min-h-50 leading-relaxed font-medium"
            />

            {/* 태그 입력 */}
            <div className="flex justify-start items-center w-full gap-1.25 mt-3">
              <Tag onClick={() => {}}>
                <span className="text-itta-point">#</span> 태그 추가
              </Tag>
              <div className="flex justify-start items-center gap-1.25">
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    className="hover:bg-transparent cursor-default"
                  >
                    <span className="text-itta-point">#</span> {tag}
                  </Tag>
                ))}
              </div>
            </div>

            {/* 이미지 추가 영역 (선택사항) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleImageClick}
              className="pb-3.75 pt-6 border-itta-gray2 flex justify-start items-center gap-2.25 cursor-pointer"
            >
              <Image
                src={'/icons/camera.svg'}
                alt={'카메라'}
                width={16}
                height={16}
                className="w-7.5 h-7.5"
              />
              <span className="font-medium">이미지 추가</span>
            </button>

            {/* 추가된 이미지 */}
            {selectedImages.length > 0 && (
              <div className="flex justify-start items-center gap-3 flex-wrap">
                {selectedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative group border-[0.5px] border-itta-gray2"
                  >
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`선택한 이미지 ${index + 1}`}
                      width={200}
                      height={200}
                      className="object-cover w-50 h-50 "
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="cursor-pointer absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 저장 버튼 */}
          <Button className="w-full my-13" onClick={handleSubmit}>
            저장하기
          </Button>
        </div>
      </main>

      {/* Floating 스크롤 버튼 */}
    </>
  );
}
