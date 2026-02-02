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
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col bg-white dark:bg-[#121212]',
        'animate-in slide-in-from-bottom duration-300',
      )}
    >
      <header className="flex items-center justify-between px-4 h-14 border-b shrink-0 bg-white dark:bg-[#1E1E1E]">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-itta-black dark:text-white" />
        </button>

        <h2 className="text-base font-bold text-center flex-1">위치 선택</h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 min-h-0 relative">
        <LocationPicker
          mode="post"
          onSelect={onSelect}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
