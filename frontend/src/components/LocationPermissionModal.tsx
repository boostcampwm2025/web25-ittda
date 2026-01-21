'use client';

import { X, MapPin } from 'lucide-react';
import { useLocationPermissionStore } from '@/store/useLocationPermissionStore';
import { useState } from 'react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: VoidFunction;
}

export default function LocationPermissionModal({
  isOpen,
  onClose,
}: LocationPermissionModalProps) {
  const { requestPermission, setHasAskedPermission } =
    useLocationPermissionStore();
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleAllow = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
    onClose();
  };

  const handleDeny = () => {
    setHasAskedPermission(true);
    onClose();
  };

  return (
    <div
      onClick={handleDeny}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative dark:bg-popover bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={handleDeny}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-itta-point/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-itta-point" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            위치 정보 사용 동의
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            잇다-는 기록 위치 저장 및 주변 기록 탐색을 위해 위치 정보를
            사용합니다.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="shrink-0 w-6 h-6 bg-itta-point/20 rounded-full flex items-center justify-center">
              <span className="text-itta-point text-xs font-bold">1</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              현재 위치를 기반으로 기록을 저장할 수 있어요
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="shrink-0 w-6 h-6 bg-itta-point/20 rounded-full flex items-center justify-center">
              <span className="text-itta-point text-xs font-bold">2</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              지도에서 내 주변의 기록들을 탐색할 수 있어요
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
          >
            나중에
          </button>
          <button
            onClick={handleAllow}
            disabled={isRequesting}
            className="flex-1 py-3 px-4 bg-itta-point text-white rounded-xl font-medium hover:bg-itta-point/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? '확인 중...' : '허용하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
