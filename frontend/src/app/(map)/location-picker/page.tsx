'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { LocationPicker } from '@/components/map/LocationPicker';
import { LocationValue } from '@/lib/types/recordField';
import Back from '@/components/Back';
import LocationPermissionChecker from '@/components/LocationPermissionChecker';

export default function LocationPickerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const isSearchMode = from === 'search';

  const handleSelect = (data: LocationValue) => {
    if (from === 'search') {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('from');
      newParams.set('lat', String(data.lat));
      newParams.set('lng', String(data.lng));
      newParams.set('address', data.address || '');
      newParams.set('radius', String(data.radius || 100));

      router.replace(`/search?${newParams.toString()}`);
    } else {
      sessionStorage.setItem('selected_location', JSON.stringify(data));
      router.back();
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <LocationPermissionChecker />
      <header className="dark:bg-[#121212]/90 bg-white/90 backdrop-blur-xl transition-all duration-500 sticky top-0 z-50 max-w-4xl w-full px-6 py-4 mx-auto flex items-center justify-between">
        <Back />
        <h1 className="font-semibold">장소 선택</h1>
        <div className="w-6" /> {/* 가운데 정렬용 */}
      </header>
      <main className="flex-1 overflow-hidden">
        <LocationPicker
          mode={isSearchMode ? 'search' : 'post'}
          onSelect={handleSelect}
          className="h-full md:h-full"
        />
      </main>
    </div>
  );
}
