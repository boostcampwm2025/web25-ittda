'use client';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { LocationValue } from '@/lib/types/record';

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

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full h-full bg-white rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <header className="p-4 border-b flex justify-between items-center bg-white">
          <button onClick={() => router.back()} className="text-gray-500">
            닫기
          </button>
          <span className="font-bold">위치 선택</span>
          <div className="w-8" />
        </header>
        <div className="h-full">
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
