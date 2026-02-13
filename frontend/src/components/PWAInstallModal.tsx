import { X } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: VoidFunction;
  isIOS: boolean;
  isSafari: boolean;
  isMacOS: boolean;
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  isIOS,
  isMacOS,
  isSafari,
}: PWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative dark:bg-popover bg-white rounded-xl shadow-2xl max-w-sm w-full p-4 sm:p-6 animate-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        </button>

        <div className="mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
            앱 설치 방법
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            브라우저에서 앱을 설치하려면 아래 단계를 따라주세요.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {isIOS ? (
            // Safari iOS
            <>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    Safari 하단의&nbsp;
                    <span className="inline-flex items-center mx-1">
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 8h2V6h-2v2zm0 4h2v-2h-2v2zm-4-8h2V2h-2v2zm4 0h2V2h-2v2z" />
                      </svg>
                    </span>
                    &nbsp;
                    <strong>(공유)</strong> 버튼을 누르세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <strong>&quot;홈 화면에 추가&quot;</strong>를 선택하세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <strong>&quot;추가&quot;</strong> 버튼을 누르면 완료!
                  </p>
                </div>
              </div>
            </>
          ) : isSafari && isMacOS ? (
            // Safari macOS
            <>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    Safari 상단 메뉴에서 <strong>파일</strong> 또는&nbsp;
                    <span className="inline-flex items-center mx-1">
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 8h2V6h-2v2zm0 4h2v-2h-2v2zm-4-8h2V2h-2v2zm4 0h2V2h-2v2z" />
                      </svg>
                    </span>
                    &nbsp;
                    <strong>(공유)</strong>를 클릭하세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <strong>&quot;Dock에 추가&quot;</strong>를 선택하세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <strong>&quot;추가&quot;</strong> 버튼을 누르면 완료!
                  </p>
                </div>
              </div>
            </>
          ) : (
            // 기타 브라우저 (Vivaldi 등)
            <>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    브라우저 주소창 오른쪽의&nbsp;
                    <strong className="inline-flex items-center mx-1">
                      ⋮ (메뉴)
                    </strong>
                    &nbsp; 버튼을 누르세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <strong>&quot;앱 설치&quot;</strong> 또는&nbsp;
                    <strong>&quot;홈 화면에 추가&quot;</strong>를 선택하세요.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-itta-point/10 rounded-full flex items-center justify-center text-itta-point font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <strong>&quot;설치&quot;</strong> 버튼을 누르면 완료!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 px-4 bg-itta-point text-white rounded-xl text-sm font-medium hover:bg-itta-point/90 active:scale-95 transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}
