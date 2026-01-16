'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { LocationValue } from '@/lib/types/recordField';
import Back from '@/components/Back';

export default function LocationPickerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const handleSelect = (data: LocationValue) => {
    if (from === 'search') {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('from');
      newParams.set('lat', String(data.lat));
      newParams.set('lng', String(data.lng));
      newParams.set('address', data.address || '');
      newParams.set('radius', String(data.radius || 5000));

      router.push(`/search?${newParams.toString()}`);
    } else {
      sessionStorage.setItem('selected_location', JSON.stringify(data));
      router.back();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <header className="border-1 p-4 border-b flex items-center justify-between">
        <Back />
        <h1 className="font-semibold">장소 선택</h1>
        <div className="w-6" /> {/* 가운데 정렬용 */}
      </header>
      <main className="flex-1 overflow-hidden">
        <LocationPicker
          mode="post"
          onSelect={handleSelect}
          className="h-full md:h-full"
        />
      </main>
    </div>
  );
}
