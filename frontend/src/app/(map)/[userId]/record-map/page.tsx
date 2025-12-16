import DiaryPostShort from '@/components/DiaryPostShort';
import GoogleMap from '../../_components/GoogleMap';

export default function RecordMapPage() {
  const dummyPosts = Array.from({ length: 10 }, (_, i) => i);

  return (
    <main className="w-full h-full flex">
      <div className="flex h-full flex-2 relative">
        <div className="flex flex-col h-full w-full overflow-y-auto">
          {dummyPosts.map((_, index) => (
            <DiaryPostShort key={index} />
          ))}
        </div>
        <div className="absolute right-0 w-2 h-10 bg-itta-black rounded-tl-md rounded-bl-md top-[50%] -translate-y-1/2 cursor-pointer" />
      </div>

      <div className="flex h-full flex-3">
        <GoogleMap />
      </div>
    </main>
  );
}
