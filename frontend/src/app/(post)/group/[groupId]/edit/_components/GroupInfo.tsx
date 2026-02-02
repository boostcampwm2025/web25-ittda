'use client';

import { Group } from '@/lib/types/group';
import { Camera, ChevronRight, ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useGroupEdit } from './GroupEditContext';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import GalleryDrawer from '@/app/(post)/_components/GalleryDrawer';
import { cn } from '@/lib/utils';
import AssetImage from '@/components/AssetImage';
import { GroupEditResponse } from '@/lib/types/groupResponse';

type GroupInfoProps = Pick<Group, 'groupThumnail'> & {
  groupId: string;
  me: GroupEditResponse['me'];
};

export default function GroupInfo({ groupId, me }: GroupInfoProps) {
  const { groupName, setGroupName, groupThumbnail, setGroupThumbnail } =
    useGroupEdit();
  const router = useRouter();

  // 그룹 이름 유효성 검사
  const getGroupNameError = () => {
    if (groupName.length < 2) return '그룹 이름은 최소 2자 이상이어야 합니다.';
    if (groupName.length > 10)
      return '그룹 이름은 최대 10자까지 입력 가능합니다.';

    // 자음/모음만 있는지 체크
    const incompleteHangulRegex = /[ㄱ-ㅎㅏ-ㅣ]/;
    if (incompleteHangulRegex.test(groupName)) {
      return '완성된 한글을 입력해주세요';
    }

    // 허용된 문자만 사용했는지 체크
    const groupNameRegex = /^[가-힣a-zA-Z0-9\s]+$/;
    if (!groupNameRegex.test(groupName)) {
      return '한글, 영문, 숫자, 공백만 사용할 수 있어요';
    }

    return null;
  };

  const groupNameError = getGroupNameError();

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center mb-6">
        <Drawer>
          <DrawerTrigger className="relative cursor-pointer">
            <div className="w-24 h-24 rounded-[32px] flex items-center justify-center border-4 shadow-sm overflow-hidden dark:bg-[#1E1E1E] dark:border-[#121212] bg-gray-50 border-white">
              {groupThumbnail?.assetId ? (
                <AssetImage
                  width={96}
                  height={96}
                  assetId={groupThumbnail.assetId}
                  alt="그룹 썸네일"
                  className="w-full h-full object-cover rounded-[32px]"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-itta-black text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
              <Camera className="w-4 h-4" />
            </div>
          </DrawerTrigger>

          <DrawerContent className="w-full px-8 py-4 pb-10">
            <DrawerHeader>
              <div className="pt-4 flex justify-between items-center mb-6">
                <DrawerTitle className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                    CHOOSE COVER
                  </span>
                  <span className="text-lg font-bold dark:text-white text-itta-black">
                    커버 사진 선택
                  </span>
                </DrawerTitle>
                <DrawerClose className="p-2 text-gray-400 cursor-pointer">
                  <X className="w-6 h-6" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <GalleryDrawer
              type="group"
              groupId={groupId}
              onSelect={(assetId, postId) =>
                setGroupThumbnail({ assetId, postId })
              }
            />
          </DrawerContent>
        </Drawer>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
          그룹 이름
        </label>
        <div className="relative">
          <input
            type="text"
            value={groupName}
            placeholder="그룹명을 작성해주세요."
            onChange={(e) => setGroupName(e.target.value)}
            className={
              (cn(
                `w-full border-b-2 bg-transparent px-1 py-3 text-lg font-bold transition-all outline-none dark:placeholder-gray-700 placeholder-gray-300 dark:border-white/5 dark:focus:border-[#10B981] dark:text-white border-gray-100 focus:border-[#10B981] text-itta-black`,
              ),
              groupNameError
                ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500'
                : 'dark:border-white/5 dark:focus:border-[#10B981] border-gray-100 focus:border-[#10B981]')
            }
          />
          {groupName && (
            <button
              onClick={() => setGroupName('')}
              className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {groupNameError && (
          <p className="text-[10px] text-red-500 px-1 font-medium">
            {groupNameError}
          </p>
        )}
      </div>

      <section className="space-y-4">
        <label className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest px-1">
          나의 그룹 프로필
        </label>
        <button
          onClick={() => router.push(`/group/${groupId}/edit/profile`)}
          className="cursor-pointer mt-4 w-full flex items-center justify-between p-5 rounded-3xl border transition-all active:scale-[0.98] dark:bg-[#10B981]/5 dark:border-[#10B981]/10 dark:hover:bg-[#10B981]/10 bg-[#10B981]/5 border-[#10B981]/10 hover:bg-[#10B981]/10"
        >
          <div className="flex items-center rounded-2xl gap-4 overflow-hidden">
            {me.profileImage?.assetId ? (
              <AssetImage
                width={48}
                height={48}
                assetId={me.profileImage.assetId}
                alt="유저 프로필"
                className="object-cover rounded-2xl border bg-white shadow-sm shrink-0"
              />
            ) : (
              <Image
                width={48}
                height={48}
                src={'/profile_base.png'}
                alt="프로필"
                className="rounded-2xl border bg-white shadow-sm shrink-0 object-cover"
              />
            )}
            <div className="text-left">
              <p className="text-sm font-bold dark:text-white text-itta-black">
                {me.nicknameInGroup}
              </p>
              <p className="text-[11px] text-[#10B981] font-medium">
                이 그룹 전용 프로필 설정하기
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#10B981]/50" />
        </button>
      </section>
    </section>
  );
}
