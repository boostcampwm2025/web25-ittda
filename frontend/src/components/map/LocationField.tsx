import { MapPin, X } from 'lucide-react';

interface LocationFieldProps {
  address?: string;
  onClick: () => void;
  onRemove: () => void;
}

export function LocationField({
  address,
  onClick,
  onRemove,
}: LocationFieldProps) {
  return (
    <div className="flex items-center justify-between w-full py-2 group">
      <div
        onClick={onClick}
        className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
      >
        <MapPin className="w-3.5 h-3.5 text-itta-point flex-shrink-0" />
        <span className="font-bold text-xs text-itta-black dark:text-white truncate">
          {address || '위치 추가'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex items-center text-itta-gray2 hover:text-rose-500 transition-colors active:scale-90"
          aria-label="위치 삭제"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
