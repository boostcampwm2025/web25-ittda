import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileInfo from './ProfileInfo';
import ProfileEditProvider from '@/app/(main)/profile/edit/_components/ProfileEditContext';

// Storybook(ProfileInfo.stories.tsx)이 이미 초기 닉네임 길이(2자 미만/10자 초과)
// 에러 상태는 시각적으로 커버하고 있어 여기서는 반복하지 않는다.
// 대신 스토리로는 검증되지 않는 부분(한글 조합/허용 문자 유효성, 실제 타이핑/삭제
// 상호작용, 이미지 선택 시 blob URL 미리보기 전환)만 다룬다.

function renderProfileInfo() {
  return render(
    <ProfileEditProvider initialNickname="초기닉네임">
      <ProfileInfo profileImage={null} />
    </ProfileEditProvider>,
  );
}

describe('ProfileInfo', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('완성되지 않은 한글(자음/모음)만 입력하면 에러를 표시한다', async () => {
    renderProfileInfo();
    const input = screen.getByPlaceholderText('사용할 닉네임을 입력해 주세요');

    await userEvent.clear(input);
    await userEvent.type(input, 'ㄱㄴㄷ');

    expect(
      screen.getByText('완성된 한글을 입력해주세요'),
    ).toBeInTheDocument();
  });

  it('한글/영문/숫자/공백 외의 문자가 있으면 에러를 표시한다', async () => {
    renderProfileInfo();
    const input = screen.getByPlaceholderText('사용할 닉네임을 입력해 주세요');

    await userEvent.clear(input);
    await userEvent.type(input, 'hello!!');

    expect(
      screen.getByText('한글, 영문, 숫자, 공백만 사용할 수 있어요'),
    ).toBeInTheDocument();
  });

  it('유효한 닉네임이면 에러 없이 안내 문구를 표시한다', async () => {
    renderProfileInfo();
    const input = screen.getByPlaceholderText('사용할 닉네임을 입력해 주세요');

    await userEvent.clear(input);
    await userEvent.type(input, '테스트닉네임');

    expect(
      screen.getByText('* 닉네임은 한글/영문/숫자/공백만 사용이 가능합니다.'),
    ).toBeInTheDocument();
  });

  it('X 버튼을 클릭하면 닉네임이 전체 삭제된다', async () => {
    renderProfileInfo();
    const input = screen.getByPlaceholderText(
      '사용할 닉네임을 입력해 주세요',
    ) as HTMLInputElement;
    expect(input.value).toBe('초기닉네임');

    await userEvent.click(screen.getByRole('button', { name: '닉네임 지우기' }));

    expect(input.value).toBe('');
  });

  it('이미지를 선택하면 blob URL로 미리보기를 전환한다', async () => {
    const { container } = renderProfileInfo();
    const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await userEvent.upload(fileInput, file);

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    const preview = container.querySelector(
      'img[src="blob:mock-url"]',
    );
    expect(preview).not.toBeNull();
  });
});
