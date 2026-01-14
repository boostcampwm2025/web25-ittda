import EmotionList from './_components/EmotionList';
import ProfileAllEmotionsHeaderActions from './_components/ProfileAllEmotionsHeaderActions';

const data = {
  nickname: '도비',
  emotions: {
    recent: [
      { name: '행복', emoji: '😊', count: 1 },
      { name: '슬픔', emoji: '😢', count: 1 },
      { name: '설렘', emoji: '🥰', count: 1 },
      { name: '좋음', emoji: '🥰', count: 1 },
      { name: '놀람', emoji: '😮', count: 1 },
    ],
    frequent: [
      { name: '행복', emoji: '😊', count: 6 },
      { name: '슬픔', emoji: '😢', count: 5 },
      { name: '설렘', emoji: '🥰', count: 4 },
      { name: '좋음', emoji: '🥰', count: 3 },
      { name: '놀람', emoji: '😮', count: 2 },
      { name: '화남', emoji: '😡', count: 1 },
      { name: '피곤', emoji: '😴', count: 1 },
    ],
    all: [
      { name: '슬픔', emoji: '😢', count: 5 },
      { name: '설렘', emoji: '🥰', count: 4 },
      { name: '좋음', emoji: '🥰', count: 3 },
      { name: '놀람', emoji: '😮', count: 2 },
      { name: '화남', emoji: '😡', count: 1 },
      { name: '피곤', emoji: '😴', count: 1 },
    ],
  },
};

export default function ProfileAllEmotionsPage() {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllEmotionsHeaderActions />

      <div className="p-5">
        <div className="rounded-xl p-6 transition-colors dark:bg-white/5 bg-gray-50">
          <p className="text-[14px] leading-relaxed mb-1 dark:text-gray-400 text-gray-500">
            <span className="font-bold">{data.nickname}</span> 님은
          </p>
          <p className="text-[14px] leading-relaxed dark:text-gray-400 text-gray-500">
            <span className="font-black text-itta-black dark:text-white">
              {data.emotions.all.length}
            </span>
            &nbsp;개의 감정을 사용하고 있어요.
          </p>
        </div>

        <EmotionList emotions={data.emotions} />
      </div>
    </div>
  );
}
