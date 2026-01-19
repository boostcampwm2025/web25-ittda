import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProfileInfo from '../../../../../../components/ProfileInfo';
import ProfileEditProvider from '@/app/(main)/profile/edit/_components/ProfileEditContext';

// Context Provider에 전달할 커스텀 args 타입
type CustomArgs = {
  profileImage: string;
  showEmail?: boolean;
  initialNickname?: string;
  email?: string;
};

const meta: Meta<CustomArgs> = {
  title: 'Profile/Edit/ProfileInfo',
  component: ProfileInfo,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    profileImage: {
      control: 'text',
      description: '프로필 이미지 URL',
    },
    showEmail: {
      control: 'boolean',
      description: '이메일 표시 여부',
    },
    initialNickname: {
      control: 'text',
      description: 'Context에 전달되는 초기 닉네임',
    },
    email: {
      control: 'text',
      description: 'Context에 전달되는 이메일',
    },
  },
  decorators: [
    (Story, context) => {
      const customArgs = context.args as CustomArgs;
      return (
        <ProfileEditProvider
          initialNickname={customArgs.initialNickname || '사용자'}
          initialImage={customArgs.profileImage}
          email={customArgs.email}
        >
          <div className="max-w-md mx-auto">
            <Story />
          </div>
        </ProfileEditProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<CustomArgs>;

export const Default: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: false,
    initialNickname: '김이따',
  },
  parameters: {
    docs: {
      description: {
        story: '기본 프로필 수정 - 이미지와 닉네임 편집',
      },
    },
  },
};

export const WithEmail: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: true,
    initialNickname: '김이따',
    email: 'user@example.com',
  },
  parameters: {
    docs: {
      description: {
        story: '이메일 표시 포함 - 이메일 필드는 수정 불가',
      },
    },
  },
};

export const EmptyNickname: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: true,
    initialNickname: '',
    email: 'user@example.com',
  },
  parameters: {
    docs: {
      description: {
        story: '닉네임 미입력 상태 - 플레이스홀더 표시',
      },
    },
  },
};

export const ShortNickname: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: true,
    initialNickname: '김',
    email: 'user@example.com',
  },
  parameters: {
    docs: {
      description: {
        story:
          '짧은 닉네임 (1자) - 에러 메시지 "닉네임은 최소 2자 이상이어야 합니다." 표시',
      },
    },
  },
};

export const LongNickname: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: true,
    initialNickname: '아주아주아주긴닉네임을가진사용자',
    email: 'very.long.email.address@example.com',
  },
  parameters: {
    docs: {
      description: {
        story:
          '긴 닉네임 (10자 초과) - 에러 메시지 "닉네임은 최대 10자까지 입력 가능합니다." 표시',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: true,
    initialNickname: '김이따',
    email: 'user@example.com',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드 - 어두운 배경의 프로필 편집',
      },
    },
  },
  decorators: [
    (Story, context) => {
      const customArgs = context.args as CustomArgs;
      return (
        <ProfileEditProvider
          initialNickname={customArgs.initialNickname || '사용자'}
          initialImage={customArgs.profileImage}
          email={customArgs.email}
        >
          <div className="dark">
            <div className="max-w-md mx-auto p-5 bg-[#121212]">
              <Story />
            </div>
          </div>
        </ProfileEditProvider>
      );
    },
  ],
};

export const Interactive: Story = {
  args: {
    profileImage: 'https://avatar.vercel.sh/user1',
    showEmail: true,
    initialNickname: '김이따',
    email: 'user@example.com',
  },
  parameters: {
    docs: {
      description: {
        story: `
프로필 편집 컴포넌트 기능:

**프로필 이미지**
- 카메라 아이콘 클릭으로 이미지 변경
- 이미지 파일 선택 시 즉시 미리보기
- Active 상태: 스케일 애니메이션

**닉네임 편집**
- 실시간 입력 가능
- 입력 중 X 버튼으로 전체 삭제
- 포커스 시 초록색 하단 보더 (정상), 빨간색 하단 보더 (에러)
- 플레이스홀더: "사용할 닉네임을 입력해 주세요"
- 안내 텍스트: "기억하고 싶은 이름으로 나를 표현해 보세요."

**닉네임 유효성 검사**
- 최소 2자 이상 (1자 이하: 에러)
- 최대 10자 이하 (10자 초과: 에러)
- 에러 시 빨간색 하단 보더 + 에러 메시지 표시

**이메일 (선택적)**
- showEmail prop으로 표시 여부 제어
- 읽기 전용 (수정 불가)
- 회색 배경으로 비활성 상태 표시
        `,
      },
    },
  },
};
