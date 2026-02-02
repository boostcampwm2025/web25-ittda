'use client';

import { useState } from 'react';
import { MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import Image from 'next/image';
import { ExifMetadata } from '@/lib/utils/exifExtractor';

interface ImageWithMetadata {
  imageUrl: string;
  metadata: ExifMetadata;
}

interface MetadataSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageWithMetadata[];
  onApplyMetadata: (
    metadata: ExifMetadata,
    imageUrl: string,
    fields: {
      applyDate: boolean;
      applyTime: boolean;
      applyLocation: boolean;
    },
  ) => void;
  lockedFields: {
    date: boolean;
    time: boolean;
    location: boolean;
  };
}

export default function MetadataSelectionDrawer({
  isOpen,
  onClose,
  images,
  onApplyMetadata,
  lockedFields,
}: MetadataSelectionDrawerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [applyDate, setApplyDate] = useState(!lockedFields.date);
  const [applyTime, setApplyTime] = useState(!lockedFields.time);
  const [applyLocation, setApplyLocation] = useState(!lockedFields.location);

  // 메타데이터가 있는 이미지만 필터링
  const imagesWithMetadata = images.filter((img) => img.metadata.hasMetadata);

  // 이미지 선택 핸들러 - 선택된 이미지의 메타데이터에 맞게 체크박스 상태 초기화
  const handleImageSelect = (idx: number) => {
    setSelectedIndex(idx);
    const metadata = imagesWithMetadata[idx].metadata;
    setApplyDate(!lockedFields.date && !!metadata.date);
    setApplyTime(!lockedFields.time && !!metadata.time);
    setApplyLocation(!lockedFields.location && !!metadata.location);
  };

  const handleApply = () => {
    if (selectedIndex === null) return;
    const selected = imagesWithMetadata[selectedIndex];

    onApplyMetadata(selected.metadata, selected.imageUrl, {
      applyDate,
      applyTime,
      applyLocation,
    });
  };

  const selectedMetadata =
    selectedIndex !== null ? imagesWithMetadata[selectedIndex].metadata : null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[85vh] flex flex-col outline-none">
        <div className="w-full px-6 pt-4 pb-10 flex flex-col h-full overflow-hidden">
          <DrawerHeader className="px-0 items-start text-left">
            <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
              사진 메타데이터 선택
            </DrawerTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {imagesWithMetadata.length > 0
                ? '메타데이터를 적용할 사진을 선택하세요'
                : '메타데이터가 있는 사진이 없습니다'}
            </p>
          </DrawerHeader>

          {imagesWithMetadata.length > 0 ? (
            <>
              {/* 이미지 선택 그리드 */}
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
                <div className="grid grid-cols-3 gap-3 py-2">
                  {imagesWithMetadata.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleImageSelect(idx)}
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${
                        selectedIndex === idx
                          ? 'ring-4 ring-[#10B981] scale-95'
                          : 'ring-2 ring-gray-200 dark:ring-white/10'
                      }`}
                    >
                      <Image
                        src={img.imageUrl}
                        width={253}
                        height={253}
                        alt={`사진 ${idx + 1}`}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      {selectedIndex === idx && (
                        <div className="absolute inset-0 bg-[#10B981]/20 flex items-center justify-center">
                          <CheckCircle2
                            size={32}
                            className="text-[#10B981] drop-shadow-lg"
                          />
                        </div>
                      )}
                      {/* 메타데이터 아이콘 표시 */}
                      <div className="absolute bottom-1 right-1 flex gap-0.5">
                        {img.metadata.date && (
                          <div className="bg-black/60 backdrop-blur-sm rounded p-0.5">
                            <Calendar size={10} className="text-white" />
                          </div>
                        )}
                        {img.metadata.time && (
                          <div className="bg-black/60 backdrop-blur-sm rounded p-0.5">
                            <Clock size={10} className="text-white" />
                          </div>
                        )}
                        {img.metadata.location && (
                          <div className="bg-black/60 backdrop-blur-sm rounded p-0.5">
                            <MapPin size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 선택된 메타데이터 정보 */}
              {selectedMetadata && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    적용할 정보 선택
                  </p>

                  {selectedMetadata.date && (
                    <label
                      className={`flex items-center gap-3 ${lockedFields.date ? 'opacity-50' : 'cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={applyDate}
                        onChange={(e) =>
                          !lockedFields.date && setApplyDate(e.target.checked)
                        }
                        disabled={lockedFields.date}
                        className="hidden" // 화면에서 숨김
                      />
                      <div
                        className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
            ${
              applyDate && !lockedFields.date
                ? 'bg-[#10B981] border-[#10B981]'
                : 'border-gray-200 dark:border-white/20'
            }
          `}
                      >
                        {applyDate && !lockedFields.date && (
                          <CheckCircle2 size={16} className="text-white" />
                        )}
                        {lockedFields.date && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-gray-400"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                      </div>
                      <Calendar
                        size={16}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        날짜: {selectedMetadata.date}
                      </span>
                    </label>
                  )}

                  {selectedMetadata.time && (
                    <label
                      className={`flex items-center gap-3 transition-opacity ${
                        lockedFields.time
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer active:opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={applyTime}
                        onChange={(e) =>
                          !lockedFields.time && setApplyTime(e.target.checked)
                        }
                        disabled={lockedFields.time}
                        className="hidden"
                      />
                      <div
                        className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
            ${
              applyTime && !lockedFields.time
                ? 'bg-[#10B981] border-[#10B981]'
                : 'border-gray-200 dark:border-white/20'
            }
          `}
                      >
                        {applyTime && !lockedFields.time && (
                          <CheckCircle2 size={16} className="text-white" />
                        )}
                        {lockedFields.time && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-gray-400"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                      </div>
                      <Clock
                        size={16}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        시간: {selectedMetadata.time}
                      </span>
                    </label>
                  )}

                  {/* 위치 필드 */}
                  {selectedMetadata.location && (
                    <label
                      className={`flex items-center gap-3 transition-opacity ${
                        lockedFields.location
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer active:opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={applyLocation}
                        onChange={(e) =>
                          !lockedFields.location &&
                          setApplyLocation(e.target.checked)
                        }
                        disabled={lockedFields.location}
                        className="hidden"
                      />
                      <div
                        className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
            ${
              applyLocation && !lockedFields.location
                ? 'bg-[#10B981] border-[#10B981]'
                : 'border-gray-200 dark:border-white/20'
            }
          `}
                      >
                        {applyLocation && !lockedFields.location && (
                          <CheckCircle2 size={16} className="text-white" />
                        )}
                        {lockedFields.location && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-gray-400"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                      </div>
                      <MapPin
                        size={16}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        위치: {selectedMetadata.location.address}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* 버튼 */}
              <div className="mt-6 flex flex-col gap-3 shrink-0">
                <button
                  onClick={handleApply}
                  disabled={selectedIndex === null}
                  className="w-full py-4 rounded-xl font-bold text-sm bg-itta-black dark:bg-white text-white dark:text-itta-black shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  메타데이터 적용
                </button>
                <DrawerClose className="w-full py-4 rounded-xl font-bold text-sm bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
                  건너뛰기
                </DrawerClose>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <DrawerClose className="w-full py-4 rounded-xl font-bold text-sm bg-itta-black text-white dark:bg-white dark:text-black shadow-xl active:scale-95 transition-all">
                닫기
              </DrawerClose>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
