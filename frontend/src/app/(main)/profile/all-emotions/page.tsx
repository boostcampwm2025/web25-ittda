import EmotionList from './_components/EmotionList';
import ProfileAllEmotionsHeaderActions from './_components/ProfileAllEmotionsHeaderActions';

const data = {
  nickname: '도비',
  emotions: {
    recent: [
      { emotion: '좋음', count: 3 },
      { emotion: '아픔', count: 4 },
      { emotion: '놀람', count: 2 },
      { emotion: '슬픔', count: 5 },
      { emotion: '행복', count: 6 },
    ],
    frequent: [
      { emotion: '행복', count: 6 },
      { emotion: '슬픔', count: 5 },
      { emotion: '아픔', count: 4 },
      { emotion: '좋음', count: 3 },
      { emotion: '화남', count: 1 },
      { emotion: '피곤', count: 1 },
    ],
    all: [
      { emotion: '슬픔', count: 5 },
      { emotion: '설렘', count: 4 },
      { emotion: '좋음', count: 3 },
      { emotion: '놀람', count: 2 },
      { emotion: '화남', count: 1 },
      { emotion: '피곤', count: 1 },
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
