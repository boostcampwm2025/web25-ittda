'use client';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { LocationValue } from '@/lib/types/record';
import { ArrowLeft } from 'lucide-react';

export default function LocationPickerModal() {
  const router = useRouter();

  const handleSelect = (data: LocationValue) => {
    // 세션에 저장하고
    sessionStorage.setItem('selected_location', JSON.stringify(data));
    //이벤트호출하기
    const event = new CustomEvent('locationSelected', { detail: data });
    window.dispatchEvent(event);
    router.back();
  };
  const handleCancel = () => {
    const event = new CustomEvent('locationSelected', { detail: null });
    window.dispatchEvent(event);
    router.back();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-full bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <header className="p-4 border-b flex justify-between items-center bg-white">
          <button onClick={handleCancel} className="cursor-pointer">
            <ArrowLeft className="dark:text-white text-itta-black" />
          </button>
          <span className="font-bold">위치 선택</span>
          <div className="w-8" />
        </header>
        <div className="h-full min-h-0">
          <LocationPicker
            mode="post"
            onSelect={handleSelect}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
