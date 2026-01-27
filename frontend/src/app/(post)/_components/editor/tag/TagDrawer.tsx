'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { TagsValue } from '@/lib/types/recordField';

interface TagDrawerProps {
  onClose: () => void;
  tags: TagsValue;
  onUpdateTags: (newTags: string[]) => void;
  previousTags: string[];
}

export default function TagDrawer({
  onClose,
  tags = { tags: [] },
  onUpdateTags,
  previousTags = [],
}: TagDrawerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showWarning, setShowWarning] = useState(false); // 경고 메시지

  const prevTags = tags.tags;
  const MAX_TAGS = 4;
  const isLimitReached = prevTags.length >= MAX_TAGS;

  const triggerWarning = () => {
    setShowWarning(true);
  };

  // 3초후에 꺼지도록
  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => {
        setShowWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  // 태그 추가 로직
  const addTag = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>,
  ) => {
    // 한글 입력 시 중복 이벤트 방지
    if (
      e &&
      'nativeEvent' in e &&
      e.nativeEvent instanceof KeyboardEvent &&
      e.nativeEvent.isComposing
    ) {
      return;
    }
    const trimmedValue = inputValue.trim();

    if (isLimitReached) {
      triggerWarning();
      return;
    }

    if (trimmedValue && !prevTags.includes(trimmedValue)) {
      onUpdateTags([...prevTags, trimmedValue]);
      setInputValue('');
    }
  };

  // 태그 삭제 로직
  const removeTag = (tagToRemove: string) => {
    onUpdateTags(prevTags.filter((t) => t !== tagToRemove));
    if (showWarning) setShowWarning(false); // 삭제 시 경고창도 바로 삭제
  };

  // 이전 태그 토글 로직
  const togglePreviousTag = (tag: string) => {
    if (prevTags.includes(tag)) {
      removeTag(tag);
    } else {
      if (isLimitReached) {
        triggerWarning();
        return;
      }
      onUpdateTags([...prevTags, tag]);
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="w-full p-8 pb-12">
          <DrawerHeader className="px-0 items-start text-left">
            <DrawerTitle className="text-xl font-bold text-itta-black dark:text-white">
              태그 추가하기
            </DrawerTitle>
          </DrawerHeader>

          {/* 현재 선택된 태그 리스트 */}
          {prevTags.length !== 0 && (
            <div className="flex flex-wrap gap-2 mb-3 min-h-8">
              {prevTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-itta-point/10 text-itta-point text-xs font-bold animate-in fade-in zoom-in-95"
                >
                  #{tag}
                  <X
                    size={14}
                    className="cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => removeTag(tag)}
                  />
                </span>
              ))}
            </div>
          )}

          {/* 태그 입력창 */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold transition-colors ${isLimitReached ? 'text-itta-gray3' : 'text-itta-point'}`}
              >
                #
              </span>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e);
                  }
                }}
                className="w-full pl-8 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 outline-none focus:ring-2 focus:ring-itta-point text-sm dark:text-white"
                placeholder={
                  isLimitReached ? '최대 개수 4개 도달' : '새 태그 입력'
                }
              />
            </div>
            <button
              onClick={addTag}
              className="p-3 rounded-2xl bg-itta-point text-white shadow-lg shadow-itta-point/20 active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* 이전 사용 태그 섹션 */}
          {previousTags.length > 0 && (
            <div className="space-y-4 mb-10">
              <p className="text-[10px] font-bold text-itta-gray3 uppercase tracking-widest leading-none">
                이전에 사용한 태그
              </p>
              <div className="flex flex-wrap gap-2">
                {previousTags.map((tag) => {
                  const isSelected = prevTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => togglePreviousTag(tag)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95
                        ${
                          isSelected
                            ? 'bg-itta-point text-white border-itta-point'
                            : 'border-gray-100 text-itta-gray3 hover:border-itta-point dark:border-white/10'
                        }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 경고 메시지 영역 (이후 토스트로 변경?)*/}
          <div className="h-6 mb-2 flex justify-center items-center">
            {showWarning && (
              <p className="text-rose-500 text-[13px] font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
                태그는 최대 {MAX_TAGS}개까지 추가할 수 있습니다.
              </p>
            )}
          </div>

          <DrawerClose className="w-full py-4 rounded-2xl font-bold bg-itta-black text-white active:scale-95 transition-all shadow-lg shadow-black/10">
            확인
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
