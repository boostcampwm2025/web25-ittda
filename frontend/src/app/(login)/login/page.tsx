'use client';

import { useRouter } from 'next/navigation';

const ServiceLogo = () => {
  return (
    <div className="relative group animate-bounce-subtle">
      {/* 로고 그림자 (바닥면) */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full blur-xl opacity-20 dark:bg-white bg-black" />

      {/* 메인 로고 컨테이너 (Squircle) */}
      <div
        className="dark:bg-linear-to-br dark:from-itta-black dark:to-[#1A1A1A] bg-linear-to-br from-itta-black to-[#222222] relative w-24 h-24 rounded-[32px] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 flex items-center justify-center"
        style={{
          boxShadow: `
          inset 0 4px 8px rgba(255,255,255,0.1),
          inset 0 -4px 8px rgba(0,0,0,0.4),
          0 15px 35px rgba(0, 0, 0, 0.25)
        `,
        }}
      >
        {/* 유리 질감 레이어 (반사 효과) */}
        <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />

        {/* 연결의 하이픈 (-) 심볼 */}
        <div className="relative w-12 h-2.5 bg-white rounded-full shadow-[0_2px_12px_rgba(16,185,129,0.4)] overflow-hidden">
          {/* 심볼 내부 하이라이트 */}
          <div className="absolute top-0 left-0 w-full h-px bg-white/30" />
        </div>

        {/* 상단 광택 (Glossy Effect) */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
      </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (provider: 'google' | 'kakao') => {
    // TODO: 서버로 로그인 요청
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col transition-colors duration-500 dark:bg-[#0F1115] bg-[#FFFFFF]">
        {/* 상단 로고 및 슬로건 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center pt-10 px-6">
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
            {/* 3D 아이콘 로고 */}
            {/* <div className="mb-10">
              <ServiceLogo />
            </div> */}

            {/* 서비스 명 */}
            <h1 className="text-4xl font-medium tracking-tighter mb-4 flex items-center dark:text-white text-[#111111]">
              잇다
              <span
                className="dark:text-white/60 text-itta-black/90 ml-1"
                style={{ fontWeight: 100 }}
              >
                -
              </span>
            </h1>

            <div className="flex flex-col items-center space-y-1.5">
              <p className="text-[13px] font-medium tracking-tight opacity-90 dark:text-gray-400 text-[#666666]">
                기억과 맥락을 잇다.
              </p>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 text-itta-point">
                Connected by Context
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-32 flex flex-col items-center w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          {/* SNS 구분선 */}
          <div className="w-full flex items-center gap-4 mb-10">
            <div className="flex-1 h-px dark:bg-white/20 bg-gray-200" />
            <span className="text-[13px] font-medium whitespace-nowrap tracking-tight dark:text-gray-500 text-gray-400">
              SNS 계정으로 간편하게 시작하기
            </span>
            <div className="flex-1 h-px dark:bg-white/20 bg-gray-200" />
          </div>

          <div className="flex items-center justify-center gap-8 mb-16">
            {/* 구글 로그인 */}
            <button
              onClick={() => handleLogin('google')}
              className="dark:bg-white/5 dark:border-white/10 bg-white border-gray-100 w-14 h-14 rounded-full flex items-center justify-center border shadow-sm transition-all hover:shadow-md active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>

            {/* 카카오 로그인 */}
            <button
              onClick={() => handleLogin('kakao')}
              className="w-14 h-14 rounded-full bg-[#FEE500] flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#3C1E1E]">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.315 6.091l-1.098 4.019c-.066.242.062.483.286.538.074.018.15.016.223-.004l4.744-3.137c.174.005.35.008.53.008 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => router.push('/')}
            className="text-[13px] font-medium transition-all hover:opacity-60 active:scale-95 dark:text-gray-500 text-gray-400"
          >
            가입 없이 시작하기
          </button>
        </div>
      </div>
    </>
  );
}
