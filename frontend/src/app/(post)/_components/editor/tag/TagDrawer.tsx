'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { TagsValue } from '@/lib/types/recordField';
import { getCachedUserTagSummary } from '@/lib/api/profile';
import { Tag } from '@/lib/types/record';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

interface TagDrawerProps {
  onClose: () => void;
  tags: TagsValue;
  onUpdateTags: (newTags: string[]) => void;
}

export default function TagDrawer({
  onClose,
  tags = { tags: [] },
  onUpdateTags,
}: TagDrawerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showWarning, setShowWarning] = useState(false); // 경고 메시지
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(true);

  const prevTags = tags.tags;
  const MAX_TAGS = 4;
  const isLimitReached = prevTags.length >= MAX_TAGS;

  useEffect(() => {
    async function fetchTags() {
      try {
        const data = await getCachedUserTagSummary();

        if (data && data.frequentTags) {
          console.log('data', data);
          const tagNames = data.frequentTags.map((item: Tag) => item.tag);
          setSuggestedTags(tagNames);
        }
      } catch (error) {
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            context: 'post-editor',
            operation: 'get-user-tag-summary',
          },
        });
        logger.error('Failed to fetch tags:', error);
      } finally {
        setIsPending(false);
      }
    }
    fetchTags();
  }, []);

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
        <div className="w-full p-6 sm:p-8 pb-10 sm:pb-12">
          <DrawerHeader className="px-0 items-start text-left">
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#10B981] uppercase tracking-[0.2em] sm:tracking-widest leading-none mb-1">
                SELECT TAGS
              </span>
              <DrawerTitle className="text-base sm:text-lg font-bold">
                태그 추가하기
              </DrawerTitle>
            </div>
          </DrawerHeader>

          {/* 현재 선택된 태그 리스트 */}
          {prevTags.length !== 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-h-7 sm:min-h-8">
              {prevTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-itta-point/10 text-itta-point text-[11px] sm:text-xs font-bold animate-in fade-in zoom-in-95"
                >
                  #{tag}
                  <X
                    size={12}
                    className="cursor-pointer hover:text-rose-500 transition-colors sm:hidden"
                    onClick={() => removeTag(tag)}
                  />
                  <X
                    size={14}
                    className="cursor-pointer hover:text-rose-500 transition-colors hidden sm:block"
                    onClick={() => removeTag(tag)}
                  />
                </span>
              ))}
            </div>
          )}

          {/* 태그 입력창 */}
          <div className="flex justify-between items-center gap-1.5 sm:gap-2 mb-5 sm:mb-6">
            <div className="flex flex-1 justify-center items-center">
              <div className="flex-1 relative">
                <span
                  className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 font-bold transition-colors pointer-events-none z-10 ${isLimitReached ? 'text-itta-gray3' : 'text-itta-point'}`}
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
                  className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg bg-gray-50 dark:bg-white/5 outline-none focus:ring-1 focus:ring-itta-point mobile-input dark:text-white"
                  placeholder={
                    isLimitReached ? '최대 개수 4개 도달' : '새 태그 입력'
                  }
                />
              </div>
            </div>
            <button
              onClick={addTag}
              className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-itta-point text-white shadow-lg shadow-itta-point/20 active:scale-90 transition-transform"
            >
              <Plus size={18} className="sm:hidden" />
              <Plus size={20} className="hidden sm:block" />
            </button>
          </div>

          {/* 이전 사용 태그 섹션 */}

          <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
            <p className="text-[9px] sm:text-[10px] font-bold text-itta-gray3">
              이전에 사용한 태그
            </p>
            {isPending && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-itta-point" />
              </div>
            )}
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {suggestedTags.map((tag) => {
                  const isSelected = prevTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => togglePreviousTag(tag)}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold border transition-all active:scale-95
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
            )}
            {!isPending && suggestedTags.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="w-full py-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center dark:bg-[#10B981]/10 bg-[#10B981]/10">
                    <TagIcon className="w-4 sm:w-5 h-4 sm:h-5 text-[#10B981]" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 text-center">
                    <p className="text-xs sm:text-sm font-bold dark:text-gray-200 text-gray-700">
                      아직 사용한 태그가 없어요
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-400">
                      태그를 추가하여 기록을 분류해보세요
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 경고 메시지 영역 (이후 토스트로 변경?)*/}
          <div className="h-5 sm:h-6 mb-1.5 sm:mb-2 flex justify-center items-center">
            {showWarning && (
              <p className="text-rose-500 text-[11px] sm:text-[13px] font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
                태그는 최대 {MAX_TAGS}개까지 추가할 수 있습니다.
              </p>
            )}
          </div>

          <DrawerClose className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-itta-black text-white active:scale-95 transition-all shadow-lg shadow-black/10 dark:bg-white dark:text-black">
            확인
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
