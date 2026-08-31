'use client';

import { Group } from '@/lib/types/group';
import { Camera, Check, ImageIcon, Loader2, Pencil, X } from 'lucide-react';
import { useGroupEdit } from './GroupEditContext';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import GalleryDrawer from '@/app/(post)/_components/GalleryDrawer';
import AssetImage from '@/components/AssetImage';
import {
  GroupEditResponse,
  GroupProfileCoverResponse,
} from '@/lib/types/groupResponse';
import { memo, useCallback, useState } from 'react';
import { useIMEInput } from '@/hooks/useIMEInput';
import { useApiPatch } from '@/hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { refreshSharedData } from '@/lib/actions/revalidate';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

type GroupInfoProps = Pick<Group, 'groupThumnail'> & {
  groupId: string;
  me: GroupEditResponse['me'];
};

const GroupInfo = memo(function GroupInfo({ groupId, me }: GroupInfoProps) {
  const { groupName, setGroupName, groupThumbnail, setGroupThumbnail } =
    useGroupEdit();
  const queryClient = useQueryClient();
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isNameSaving, setIsNameSaving] = useState(false);
  const [originalGroupName, setOriginalGroupName] = useState('');
  const [isCoverSaving, setIsCoverSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { mutateAsync: updateGroup } = useApiPatch(`/api/groups/${groupId}`);
  const { mutateAsync: updateGroupCover } =
    useApiPatch<GroupProfileCoverResponse>(`/api/groups/${groupId}/cover`);

  const invalidateGroup = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['group', groupId] }),
      queryClient.invalidateQueries({ queryKey: ['shared'] }),
      refreshSharedData(),
    ]);
  }, [queryClient, groupId]);

  const getGroupNameError = () => {
    if (groupName.length < 2) return '그룹 이름은 최소 2자 이상이어야 합니다.';
    if (groupName.length > 30)
      return '그룹 이름은 최대 30자까지 입력 가능합니다.';
    const incompleteHangulRegex = /[ㄱ-ㅎㅏ-ㅣ]/;
    if (incompleteHangulRegex.test(groupName))
      return '완성된 한글을 입력해주세요';
    const groupNameRegex = /^[가-힣a-zA-Z0-9\s]+$/;
    if (!groupNameRegex.test(groupName))
      return '한글, 영문, 숫자, 공백만 사용할 수 있어요';
    return null;
  };

  const handleThumbnailSelect = useCallback(
    async (assetId: string, postId: string) => {
      const prev = groupThumbnail;
      setGroupThumbnail({ assetId, postId });
      setIsDrawerOpen(false);
      setIsCoverSaving(true);
      try {
        await updateGroupCover({ assetId, sourcePostId: postId });
        await invalidateGroup();
        toast.success('커버가 변경되었습니다.');
      } catch (error) {
        setGroupThumbnail(prev);
        Sentry.captureException(error, {
          level: 'error',
          tags: { context: 'group-info', operation: 'update-group-cover' },
          extra: { assetId, postId },
        });
        logger.error('커버 변경 실패', error);
        toast.error('커버 변경에 실패했습니다.');
      } finally {
        setIsCoverSaving(false);
      }
    },
    [groupThumbnail, setGroupThumbnail, updateGroupCover, invalidateGroup],
  );

  const handleNameSave = async () => {
    if (getGroupNameError()) return;
    setIsNameSaving(true);
    try {
      await updateGroup({ name: groupName });
      await invalidateGroup();
      toast.success('그룹 이름이 변경되었습니다.');
      setIsNameEditing(false);
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: { context: 'group-info', operation: 'update-group-name' },
        extra: { groupName },
      });
      logger.error('그룹 이름 변경 실패', error);
      toast.error('그룹 이름 변경에 실패했습니다.');
    } finally {
      setIsNameSaving(false);
    }
  };

  const handleGroupNameClear = useCallback(() => {
    setGroupName('');
  }, [setGroupName]);

  const groupNameImeProps = useIMEInput(setGroupName);

  const isAdmin = me.role === 'ADMIN';
  const groupNameError = isNameEditing ? getGroupNameError() : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center mb-6">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <div
            onClick={() => isAdmin && !isCoverSaving && setIsDrawerOpen(true)}
            className={`relative ${isAdmin ? 'cursor-pointer' : ''}`}
          >
            <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-[32px] flex items-center justify-center border-4 shadow-sm overflow-hidden dark:bg-[#1E1E1E] dark:border-[#121212] bg-gray-50 border-white">
              {groupThumbnail?.assetId ? (
                <AssetImage
                  width={96}
                  height={96}
                  assetId={groupThumbnail.assetId}
                  alt="그룹 썸네일"
                  className="w-full h-full object-cover rounded-[32px]"
                  wrapperClassName="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-itta-black text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                {isCoverSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </div>
            )}
          </div>

          <DrawerContent className="w-full px-6 sm:px-8 pt-4 pb-8 sm:pb-10">
            <DrawerHeader>
              <div className="pt-4 flex justify-between items-center mb-4 sm:mb-6">
                <DrawerTitle className="flex flex-col justify-center items-start pl-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
                    CHOOSE COVER
                  </span>
                  <span className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                    커버 사진 선택
                  </span>
                </DrawerTitle>
                <DrawerClose className="sm:p-2 text-gray-400 cursor-pointer">
                  <X className="w-6 h-6" />
                </DrawerClose>
              </div>
            </DrawerHeader>

            <GalleryDrawer
              type="group"
              groupId={groupId}
              onSelect={handleThumbnailSelect}
            />
          </DrawerContent>
        </Drawer>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            그룹 이름
          </label>
          {isAdmin &&
            (isNameEditing ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setGroupName(originalGroupName);
                    setIsNameEditing(false);
                  }}
                  disabled={isNameSaving}
                  className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-gray-400 disabled:opacity-40 transition-opacity"
                >
                  취소
                </button>
                <button
                  onClick={handleNameSave}
                  disabled={isNameSaving || !!getGroupNameError()}
                  className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-[#10B981] disabled:opacity-40 transition-opacity"
                >
                  {isNameSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setOriginalGroupName(groupName);
                  setIsNameEditing(true);
                }}
                className="cursor-pointer flex items-center gap-1 text-[11px] font-bold text-gray-400"
              >
                <Pencil className="w-3.5 h-3.5" />
                편집
              </button>
            ))}
        </div>
        <div className="relative">
          <input
            type="text"
            disabled={!isNameEditing || isNameSaving}
            value={groupName}
            placeholder="그룹명을 작성해주세요."
            {...groupNameImeProps}
            className={`mobile-input w-full border-b-2 bg-transparent px-1 py-4 text-sm font-semibold transition-all outline-none dark:placeholder-gray-700 placeholder-gray-300 ${
              isNameEditing
                ? 'dark:text-white text-itta-black'
                : 'text-gray-400 dark:text-gray-500'
            } ${
              groupNameError
                ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500'
                : 'dark:border-white/5 dark:focus:border-[#10B981] border-gray-100 focus:border-[#10B981]'
            }`}
          />
          {isNameEditing && groupName && (
            <button
              onClick={handleGroupNameClear}
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
    </section>
  );
});

export default GroupInfo;
