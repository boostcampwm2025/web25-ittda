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
    docs: {
      description: {
        component:
          '프로필 편집 페이지의 닉네임/이메일 입력 폼 컴포넌트입니다. 프로필 이미지 변경, 닉네임 실시간 입력(2~10자 유효성 검사), 이메일 읽기 전용 표시를 제공합니다. ProfileEditProvider 컨텍스트를 통해 상태를 관리합니다.',
      },
    },
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
          <div className="max-w-2xl mx-auto">
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
        story: `
기본 프로필 수정 - 이미지와 닉네임 편집
- **프로필 이미지 클릭**: 카메라 아이콘 클릭으로 이미지 파일 선택, 선택 즉시 미리보기 업데이트
- **닉네임 입력**: 실시간 입력 가능, 포커스 시 초록색 하단 보더 표시
- **닉네임 삭제(X 버튼)**: 입력 중 X 버튼 클릭으로 전체 삭제
- **유효성 에러**: 1자 이하 또는 10자 초과 시 빨간색 하단 보더 + 에러 메시지 표시
- **이메일 필드**: \`showEmail\` prop이 true일 때 표시, 읽기 전용(회색 배경)
        `,
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

