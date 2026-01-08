import { Check } from 'lucide-react';
import ProfileEditHeaderActions from '../../_components/ProfileEditHeaderActions';
import ProfileInfo from '../../_components/ProfileInfo';

const profile = {
  image: '/profile-ex.jpeg',
  nickname: '도비',
  email: 'wndqhr__@naver.com',
};

export default function ProfileEditPage() {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileEditHeaderActions />
      <div className="p-8 flex flex-col gap-10 pb-32">
        <ProfileInfo profile={profile} />

        {/* <div className="w-full py-0">
          <div className="p-5 rounded-2xl border flex gap-4 transition-all dark:bg-[#10B981]/10 dark:border-[#10B981]/20 bg-[#10B981]/5 border-[#10B981]/10">
            <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
              <Check
                className="w-3.5 h-3.5 dark:text-black text-white"
                strokeWidth={3}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold">알려드립니다</p>
              <p className="text-[11px] leading-relaxed font-medium transition-colors dark:text-gray-400 text-gray-500">
                변경된 프로필 정보는 서비스 전체 및 공유 기록 폴더의
                멤버들에게도 동일하게 노출됩니다.
              </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
