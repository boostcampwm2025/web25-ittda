//import { toast } from 'sonner';

export const INVITE_ERROR_POLICY = {
  INVITE_CODE_EXPIRED: {
    message: '만료된 초대 코드입니다. 다시 요청해주세요.',
    path: '/',
    action: 'replace',
  },
  BAD_REQUEST: {
    message: '이미 이 그룹의 멤버입니다.',
    path: '/shared',
  },
  GROUP_FULL: {
    message: '그룹 인원이 가득 차서 참여할 수 없습니다.',
    path: null,
  },
} as const;

export const handleInviteError = (error: unknown) => {
  const apiError = error as {
    code?: string;
    data?: { code?: string; message?: string };
    message?: string;
  };

  const errorCode = apiError.code ?? apiError.data?.code;
  const policy =
    errorCode && errorCode in INVITE_ERROR_POLICY
      ? INVITE_ERROR_POLICY[errorCode as keyof typeof INVITE_ERROR_POLICY]
      : null;

  if (policy) {
    //toast.error(policy.message);

    if (policy.path) {
      return policy.path;
    }
  }
};
