'use client';

import { ArrowLeft } from 'lucide-react';
import { LocationPicker } from '@/components/map/LocationPicker';
import { LocationValue } from '@/lib/types/record';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onSelect: (data: LocationValue) => void;
  onClose: () => void;
}

export default function LocationDrawer({ isOpen, onSelect, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/30 flex items-center justify-center">
      <div
        className={cn(
          'max-w-4xl w-full h-full inset-0 z-100 flex flex-col bg-white dark:bg-[#121212]',
          'animate-in slide-in-from-bottom duration-300',
        )}
      >
        <header className="dark:bg-[#121212]/90 bg-white/90 backdrop-blur-xl transition-all duration-500 sticky top-0 z-50 max-w-4xl w-full px-4 sm:px-6 py-3 sm:py-4 mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="cursor-pointer active:scale-80 transition-all"
          >
            <ArrowLeft className="dark:text-white text-itta-black" />
          </button>
          <h2 className="font-semibold text-sm sm:text-base dark:text-white">
            위치 선택
          </h2>
          <div className="w-5 sm:w-6" />
        </header>

        <div className="flex-1 min-h-0 relative">
          <LocationPicker
            mode="post"
            onSelect={onSelect}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
