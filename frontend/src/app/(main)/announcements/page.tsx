import Back from '@/components/Back';
import { serverFetch } from '@/lib/api/serverFetch';
import AssetImage from '@/components/AssetImage';

interface Announcement {
  id: string;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
}

async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await serverFetch('/v1/announcements', { cache: 'no-store' });
    if (!res.ok) return [];
    const body = await res.json();
    return (body.data ?? []) as Announcement[];
  } catch {
    return [];
  }
}

function formatKoreanDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AnnouncementsPage() {
  const announcements = await fetchAnnouncements();

  return (
    <div className="w-full pb-bottom-nav flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <header className="sticky top-0 z-50 max-w-4xl w-full mx-auto px-4 py-3 sm:px-5 sm:py-6 flex items-center justify-between dark:bg-[#121212] bg-white transition-all duration-500">
        <Back fallback="/profile" />
        <h2 className="text-sm sm:text-base font-medium dark:text-white text-itta-black">
          공지사항
        </h2>
        <div className="w-6 h-6" />
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-5 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <p className="text-sm sm:text-base font-medium">공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-4 shadow-sm"
            >
              {announcement.imageUrl && (
                <div className="relative w-full h-36 mb-3 rounded-xl overflow-hidden">
                  <AssetImage
                    assetId={announcement.imageUrl}
                    alt={announcement.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 896px) 100vw, 896px"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                {announcement.isActive && (
                  <span className="shrink-0 text-[10px] font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    진행 중
                  </span>
                )}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {announcement.title}
                </h3>
              </div>
              {announcement.content && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 whitespace-pre-line">
                  {announcement.content}
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                {formatKoreanDate(announcement.createdAt)}
              </p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
