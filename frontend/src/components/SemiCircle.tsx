import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right';
type Size = 'default';

interface SemiCircleProps {
  direction?: Direction;
  className?: string;
  size?: Size;
}

export default function SemiCircle({
  direction = 'up',
  size = 'default',
  className = '',
}: SemiCircleProps) {
  const rotateMap = {
    up: 'rotate-90',
    right: 'rotate-180',
    down: '-rotate-90',
    left: 'rotate-0',
  };

  const sizeMap = {
    default: 'w-3.75 h-7.5',
  };

  const circleMap = {
    default: 'w-7.5 h-7.5',
  };

  return (
    <div
      className={cn(
        'overflow-hidden',
        direction && rotateMap[direction],
        size && sizeMap[size],
        className,
      )}
    >
      <div
        className={cn(
          'bg-white rounded-full border border-itta-gray2',
          circleMap[size],
        )}
      />
    </div>
  );
}
