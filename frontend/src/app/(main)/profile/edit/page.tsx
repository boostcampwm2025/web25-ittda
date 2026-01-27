import ProfileEditClient from './_components/ProfileEditClient';

const profile = {
  id: 'uuid',
  profileImageId: '/profile-ex.jpeg',
  nickname: '도비',
  email: 'wndqhr__@naver.com',
};

export default function ProfileEditPage() {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileEditClient profile={profile} />
    </div>
  );
}
