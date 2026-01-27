import ProfileAllTagsHeaderActions from './_components/ProfileAllTagsHeaderActions';
import TagList from './_components/TagList';
import {
  getCachedUserProfile,
  getCachedUserTagSummary,
} from '@/lib/api/profile';

export default async function ProfileAllTagsPage() {
  const [tagData, profile] = await Promise.all([
    getCachedUserTagSummary(),
    getCachedUserProfile(),
  ]);

  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllTagsHeaderActions />

      <div className="p-5">
        <div className="rounded-xl p-6 transition-colors dark:bg-white/5 bg-gray-50">
          <p className="text-[14px] leading-relaxed mb-1 dark:text-gray-400 text-gray-500">
            <span className="font-bold">{profile.user.nickname}</span> 님은
          </p>
          <p className="text-[14px] leading-relaxed dark:text-gray-400 text-gray-500">
            <span className="font-black text-itta-black dark:text-white">
              {tagData.frequentTags.length}
            </span>
            &nbsp;개의 태그를 사용하고 있어요.
          </p>
        </div>

        <TagList tags={tagData} />
      </div>
    </div>
  );
}
