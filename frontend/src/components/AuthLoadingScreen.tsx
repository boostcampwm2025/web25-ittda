export default function AuthLoadingScreen() {
  return (
    <div className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8">
        {/* 연결되는 직선 애니메이션 */}
        <div className="relative w-32 h-2 overflow-hidden">
          {/* 이동하는 선 */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-gray-800">
            <div className="h-full w-15 bg-white animate-move-line" />
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-white">잇는 중입니다</p>
          <p className="text-sm text-gray-300">잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
}
