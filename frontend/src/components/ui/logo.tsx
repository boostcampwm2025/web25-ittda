export default function Logo() {
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
}
