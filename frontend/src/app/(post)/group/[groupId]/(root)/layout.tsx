import { Users } from 'lucide-react';
import Image from 'next/image';
import GroupHeaderActions from '../../_components/GroupHeaderActions';

const groupInfo = {
  name: '우리 가족 추억함',
  inviteCode: 'DLOG-FAMILY-99',
  members: [
    {
      id: 1,
      name: '나',
      avatar: '/profile-ex.jpeg',
    },
    {
      id: 2,
      name: '엄마',
      avatar: '/profile-ex.jpeg',
    },
    {
      id: 3,
      name: '아빠',
      avatar: '/profile-ex.jpeg',
    },
  ],
};

export default function GroupRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full flex flex-col gap-6 p-6">
      <header className="sticky top-0 z-50 w-full inset-x-0 pb-6 pt-4 transition-all duration-300 dark:bg-[#121212] bg-white">
        <GroupHeaderActions groupInfo={groupInfo} />

        <div className="flex items-end justify-between px-1">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight dark:text-white text-itta-black">
              {groupInfo.name}
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              {groupInfo.members.length}명의 가족 활동 중
            </div>
          </div>
          <div className="flex -space-x-2">
            {groupInfo.members.map((m) => (
              <Image
                key={m.id}
                src={m.avatar}
                width={50}
                height={50}
                className="w-8 h-8 rounded-full border-2 shadow-sm bg-white dark:border-[#121212] border-white"
                alt={m.name}
              />
            ))}
          </div>
        </div>
      </header>
      <>
        <div className="flex items-center justify-start px-1">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            기록 보관함
          </h3>
        </div>

        {children}
      </>
    </main>
  );
}
