import {
  getCachedUserProfile,
  getCachedUserEmotionSummary,
} from '@/lib/api/profile';
import EmotionList from './_components/EmotionList';
import ProfileAllEmotionsHeaderActions from './_components/ProfileAllEmotionsHeaderActions';

export default async function ProfileAllEmotionsPage() {
  const [emotionData, profile] = await Promise.all([
    getCachedUserEmotionSummary(),
    getCachedUserProfile(),
  ]);

  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllEmotionsHeaderActions />

      <div className="p-5">
        <div className="rounded-xl p-6 transition-colors dark:bg-white/5 bg-gray-50">
          <p className="text-[14px] leading-relaxed mb-1 dark:text-gray-400 text-gray-500">
            <span className="font-bold">{profile.user.nickname}</span> 님은
          </p>
          <p className="text-[14px] leading-relaxed dark:text-gray-400 text-gray-500">
            <span className="font-black text-itta-black dark:text-white">
              {emotionData.emotion.length}
            </span>
            &nbsp;개의 감정을 사용하고 있어요.
          </p>
        </div>

        <EmotionList emotions={emotionData.emotion} />
      </div>
    </div>
  );
}
