import { BadRequestException } from '@nestjs/common';

const GROUP_NICKNAME_REGEX = /^[a-zA-Z0-9가-힣 ]+$/;
const DEFAULT_GROUP_NICKNAME = '유저';

export function validateGroupNickname(nickname: string): string {
  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    throw new BadRequestException('닉네임은 2자 이상 50자 이하이어야 합니다.');
  }
  if (!GROUP_NICKNAME_REGEX.test(trimmed)) {
    throw new BadRequestException(
      '닉네임은 한글, 영문, 숫자, 공백만 허용됩니다.',
    );
  }
  return trimmed;
}

export function resolveGroupNickname(nickname?: string | null): string {
  if (!nickname) return DEFAULT_GROUP_NICKNAME;
  try {
    return validateGroupNickname(nickname);
  } catch {
    return DEFAULT_GROUP_NICKNAME;
  }
}
