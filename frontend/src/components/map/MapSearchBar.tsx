import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';
import Input from '../Input';
import { Search, MapPin, Loader2, X } from 'lucide-react';

interface MapSearchBarProps {
  onSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  searchResults: google.maps.places.PlaceResult[];
  onSearch: (query: string) => void;
  isSearching?: boolean;
  hasSelectedLocation?: boolean;
  onClear?: () => void;
}
type RightIconState = 'loading' | 'clear' | 'search';

export function MapSearchBar({
  onSelect,
  placeholder,
  searchResults,
  onSearch,
  isSearching,
  hasSelectedLocation,
  onClear,
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // 검색 실행 함수
  const triggerSearch = () => {
    if (!query.trim()) return;
    onSearch(query);
    setShowResults(true);
  };
  const handleClear = () => {
    if (!onClear) return;
    setQuery('');
    onClear();
    setShowResults(false);
  };

  const rightIconState: RightIconState = isSearching
    ? 'loading'
    : hasSelectedLocation
      ? 'clear'
      : 'search';

  return (
    <Popover
      open={showResults && searchResults.length > 0}
      onOpenChange={setShowResults}
    >
      <PopoverTrigger asChild>
        <div className="w-full">
          <Input className="shadow-xl border-none bg-white dark:bg-[#1E1E1E]">
            <Input.Field
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') triggerSearch();
              }}
              className="dark:text-white"
            />
            <Input.Right>
              <button
                type="button"
                onClick={
                  rightIconState === 'clear' ? handleClear : triggerSearch
                }
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                {rightIconState === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}

                {rightIconState === 'clear' && (
                  <X className="w-4 h-4 text-gray-400" />
                )}

                {rightIconState === 'search' && (
                  <Search className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </Input.Right>
          </Input>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-white shadow-2xl border-none rounded-xl overflow-hidden mt-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-60 overflow-y-auto">
          {searchResults.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => {
                onSelect(p);
                setShowResults(false);
                setQuery(p.name || '');
              }}
              className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-0 flex items-center gap-3 transition-colors"
            >
              <MapPin size={14} className="text-itta-point" />
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">
                  {p.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {p.formatted_address}
                </p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
