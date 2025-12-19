'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatTime } from '@/lib/date';
import Image from 'next/image';
import Tag from '@/components/TagButton';
import { Button } from '@/components/ui/button';
import { createPost } from '@/lib/api/posts';
import { TimePicker } from '@/components/TimePicker';
import DatePicker from '@/components/DatePicker';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import Input from '@/components/Input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { useRouter } from 'next/navigation';

interface PostDraft {
  title: string;
  content: string;
  tags: string[];
  selectedTime: string;
  selectedDate: string;
  selectedLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

export default function CreatePostPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 위치 가져오기 (역지오코딩 활성화)
  const {
    latitude,
    longitude,
    address,
    loading: locationLoading,
    error: locationError,
  } = useGeolocation({ reverseGeocode: true });

  // sessionStorage를 사용한 임시 저장
  const [draft, setDraft, clearDraft] = useSessionStorage<PostDraft>(
    'diary-travel-draft',
    {
      title: '',
      content: '',
      tags: [],
      selectedTime: '오전 12:00',
      selectedDate: new Date('2000-01-01').toISOString(),
      selectedLocation: null,
    },
  );

  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [tags, setTags] = useState<string[]>(draft.tags);
  const [tmpInputTags, setTmpInputTags] = useState<string[]>([...draft.tags]);
  const [currentTag, setCurrentTag] = useState('');

  const [mounted, setMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTime, setSelectedTime] = useState(draft.selectedTime);
  const [selectedDate, setSelectedDate] = useState(
    new Date(draft.selectedDate),
  );

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // 위치 정보 상태 관리
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(draft.selectedLocation);

  // 클라이언트 마운트 확인 (hydration 에러 방지)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // 최초 마운트 시에만 현재 시간으로 초기화 (draft가 비어있을 때만)
    if (!isInitialized) {
      // draft에 값이 없으면 현재 시간으로 초기화
      if (
        draft.selectedTime === '오전 12:00' &&
        draft.selectedDate === new Date('2000-01-01').toISOString()
      ) {
        setSelectedTime(formatTime());
        setSelectedDate(new Date());
      }
      setIsInitialized(true);
    }
  }, [draft.selectedTime, draft.selectedDate, isInitialized]);

  // 위치 정보가 로드되면 자동으로 설정 (draft에 저장된 위치가 없을 때만)
  useEffect(() => {
    if (
      latitude &&
      longitude &&
      address &&
      !draft.selectedLocation &&
      mounted
    ) {
      setSelectedLocation({ latitude, longitude, address });
    }
  }, [latitude, longitude, address, mounted]);

  // 상태 변경 시 sessionStorage에 자동 저장
  useEffect(() => {
    if (mounted) {
      setDraft({
        title,
        content,
        tags,
        selectedTime,
        selectedDate: selectedDate.toISOString(),
        selectedLocation,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    content,
    tags,
    selectedTime,
    selectedDate,
    selectedLocation,
    mounted,
  ]);

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
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTmpInputTags([...tmpInputTags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTmpInputTags(tmpInputTags.filter((tag) => tag !== tagToRemove));
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
    requestAnimationFrame(() => {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    });
  };

  const handleRemoveLocation = () => {
    setSelectedLocation(null);
  };

  const handleSubmit = async () => {
    await createPost({
      title,
      content,
      templateType: 'diary',
      eventDate: new Date().toISOString(),
      address: selectedLocation?.address,
      lat: 35.1395,
      lng: 126.853,
      tags,
    });

    // 작성이 완료되면 이전 화면으로 돌아가기
    clearDraft();
    router.back();
  };

  // 클라이언트 마운트 전에는 로딩 표시
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-itta-gray3">로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      <main ref={mainContainerRef} className="w-full h-full overflow-y-auto">
        <div className="w-full px-6 py-8 ">
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
                  <button
                    onClick={() => router.push('/create/select-location')}
                    className="not-italic truncate max-w-44 overflow-hidden cursor-pointer"
                  >
                    {selectedLocation
                      ? selectedLocation.address
                      : locationLoading
                        ? '위치 가져오는 중...'
                        : locationError
                          ? '위치를 가져올 수 없습니다'
                          : '위치 추가하기'}
                  </button>
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={handleRemoveLocation}
                      className="cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="h-full border-l border-itta-gray2 w-full px-6 py-3.5 mt-2.5">
            {/* 제목 입력 */}
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold text-itta-black placeholder:text-itta-gray3/60 border-none outline-none mb-4"
            />

            {/* 본문 입력 - 자동 높이 조절 */}
            <textarea
              ref={textareaRef}
              placeholder="이곳에서 당신이 느낀 모든 것을 남겨보세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-md text-itta-black placeholder:text-itta-gray3/60 border-none outline-none resize-none min-h-50 leading-relaxed font-medium"
            />

            {/* 태그 입력 */}
            <div className="flex flex-wrap justify-start items-center w-full gap-1.25 mt-3">
              <Drawer>
                <DrawerTrigger>
                  <Tag>
                    <span className="text-itta-point">#</span> 태그 추가/수정
                  </Tag>
                </DrawerTrigger>
                <DrawerContent className="max-w-5xl mx-auto">
                  <DrawerHeader>
                    <DrawerTitle>태그 추가</DrawerTitle>
                    <DrawerDescription className="break-keep">
                      기록을 그룹화하고 나중에 빠르게 검색하기 위해 태그를
                      추가해 보세요.
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="md:px-18 px-4 flex flex-col w-full pb-8.5">
                    <div className="flex flex-wrap justify-start items-center gap-1.25 pb-8">
                      {tmpInputTags.map((tag) => (
                        <Tag
                          onClick={() => handleRemoveTag(tag)}
                          key={tag}
                          className="hover:bg-transparent flex justify-between items-center gap-1.25"
                        >
                          <span className="text-itta-point">#</span> {tag}
                          <X size={14} color="var(--itta-gray3)" />
                        </Tag>
                      ))}
                    </div>
                    <div className="flex justify-center items-center w-full gap-3">
                      <Input className="w-full font-medium">
                        <Input.Left>
                          <span className="text-itta-point">#</span>
                        </Input.Left>
                        <Input.Field
                          value={currentTag}
                          onKeyDown={handleAddTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          placeholder="태그를 추가하세요"
                        />
                      </Input>
                      <DrawerClose>
                        <Button onClick={() => setTags([...tmpInputTags])}>
                          저장
                        </Button>
                      </DrawerClose>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>

              <div className="flex justify-start items-center gap-1.25 flex-wrap">
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

            {/* 이미지 추가 영역 */}
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
          <Button className="w-full" onClick={handleSubmit}>
            저장하기
          </Button>
        </div>
      </main>

      {/* Floating 스크롤 버튼 */}
    </>
  );
}
