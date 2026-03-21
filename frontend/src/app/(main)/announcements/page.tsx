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
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function AnnouncementsPage() {
  const announcements = await fetchAnnouncements();

  return (
    <div className="w-full pb-bottom-nav flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <header className="sticky top-0 z-50 max-w-4xl w-full mx-auto px-4 py-3 sm:px-5 sm:py-6 flex items-center justify-between dark:bg-[#121212] bg-white backdrop-blur-xl transition-all duration-500">
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
              className="rounded-xl sm:rounded-2xl p-4 sm:p-5 border dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100 shadow-xs flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold dark:text-white text-itta-black leading-snug">
                  {announcement.title}
                </h3>
                {announcement.isActive && (
                  <span className="shrink-0 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                    진행 중
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">
                {formatKoreanDate(announcement.createdAt)}
              </p>
              {announcement.imageUrl && (
                <div className="relative w-full aspect-video mt-1">
                  <AssetImage
                    assetId={announcement.imageUrl}
                    alt={announcement.title}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 896px) 100vw, 896px"
                  />
                </div>
              )}
              {announcement.content && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {announcement.content}
                </p>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
