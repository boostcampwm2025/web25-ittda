'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Users, Check } from 'lucide-react';
import { setCookie } from '@/lib/utils/cookie';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { useJoinGroup } from '@/hooks/useGroupInvite';
import { createApiError } from '@/lib/utils/errorHandler';
import { handleInviteError } from '../_utils/handleInviteError';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, userType } = useAuthStore();
  const inviteCode = searchParams.get('inviteCode');
  const groupName = '새 그룹';
  const nickname = '현재 계정';

  const { mutate: joinGroup } = useJoinGroup(inviteCode || '');
  const currentState = !isLoggedIn
    ? 'anonymous'
    : userType === 'guest'
      ? 'guest'
      : 'social';

  //닉네임 동적할당을 위해 우선 함수 내부에 선언
  const contentConfig = {
    button: {
      social: `${nickname}으로 참여하기`,
      guest: '게스트 계정으로 참여하기',
      anonymous: '수락하기',
    }[currentState],
    description: {
      social: '현재 로그인된 계정으로 즉시 그룹에 합류합니다.',
      guest:
        '현재 브라우저 저장된 게스트 정보로 참여합니다.\n별도의 아이디 없이 이 기기에서 3일간 정보가 유지됩니다.',
      anonymous: '로그인 또는 가입 후 바로 그룹에 가입이 됩니다.',
    }[currentState],
    showSwitch: currentState !== 'anonymous',
    isWarning: currentState === 'guest',
  };

  // 수락 버튼 핸들러
  const handleAccept = async (forceLogin = false) => {
    if (!inviteCode) return;

    //현재 계정으로 즉시 참여
    if (isLoggedIn && !forceLogin) {
      joinGroup(
        {},
        {
          onSuccess: (response) => {
            const groupId = response.data.groupId;
            //const groupName = response.data.group.name;
            if (!groupId) createApiError(response);

            toast.success(`그룹에 참여되었습니다!`);
            router.replace(`/group/${groupId}`);
          },
          onError: (error) => {
            //TODO: 임시 작업 현재 toast 가 두개 뜨는 문제 존재
            const path = handleInviteError(error);
            if (path) router.replace(path);
          },
        },
      );
    }

    // 다른 계정으로 가입하거나 로그인이 필요한 경우
    // 로그인 성공 후 그룹 가입시키기 위해 쿠키에 추가
    setCookie('invite-code', inviteCode, {
      days: 1,
    });

    toast.info('로그인 후 자동으로 그룹에 가입됩니다.');
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9] flex justify-center">
      <div className="border-b-[0.5px] border-gray-100 dark:border-gray-800 p-6 pt-12 text-center">
        <div className="inline-flex p-3 rounded-full bg-itta-point/10 mb-4">
          <Users className="text-itta-point w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-4">그룹 초대</h1>
        <div className="bg-white dark:bg-[#1e1e1e] p-8  rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center space-y-4">
          <div>
            <span className="text-itta-point font-semibold text-[16px]">
              {groupName}
            </span>
            <span className="text-[16px] font-medium text-gray-600 dark:text-gray-300">
              {' '}
              그룹에서
            </span>
          </div>
          <p className="text-[15px] leading-relaxed">
            회원님을 초대했습니다.
            <br />
            함께 공동 기록을 작성하고 공유할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-6">
        <button
          onClick={() => handleAccept(false)}
          className="w-full h-14 bg-black dark:bg-white dark:text-black text-white rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md"
        >
          <Check size={20} />
          {contentConfig.button}
        </button>

        {contentConfig.showSwitch && (
          <button
            onClick={() => handleAccept(true)}
            className="text-sm text-gray-400 underline underline-offset-4 hover:text-gray-600 dark:hover:text-gray-200 text-center transition-colors mb-2"
          >
            다른 계정으로 시작하기
          </button>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-5">
          {contentConfig.description}
        </p>
      </div>
    </div>
  );
}
