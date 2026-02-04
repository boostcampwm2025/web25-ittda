import { cn } from '@/lib/utils';

type LoadingType = 'default' | 'publish';

interface Props {
  type?: LoadingType;
  className?: string;
}

const LOADING_MESSAGES: Record<LoadingType, { title: string; desc: string }> = {
  default: {
    title: '잇는 중입니다',
    desc: '잠시만 기다려주세요...',
  },

  publish: {
    title: '기록을 발행하는 중입니다',
    desc: '소중한 기억이 곧 업로드됩니다...',
  },
};
export default function AuthLoadingScreen({
  type = 'default',
  className,
}: Props) {
  const displayTitle = LOADING_MESSAGES[type].title;
  const displayDesc = LOADING_MESSAGES[type].desc;

  return (
    <div
      className={cn(
        'bg-black/50 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-8">
        {/* 연결되는 직선 애니메이션 */}
        <div className="relative w-32 h-2 overflow-hidden">
          {/* 이동하는 선 */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 dark:bg-gray-800 bg-gray-400">
            <div className="h-full w-15 bg-white animate-move-line" />
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-white">{displayTitle}</p>
          <p className="text-sm text-gray-300">{displayDesc}</p>
        </div>
      </div>
    </div>
  );
}
