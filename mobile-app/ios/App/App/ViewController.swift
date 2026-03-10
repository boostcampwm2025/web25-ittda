import UIKit
import WebKit
import Capacitor

class ViewController: CAPBridgeViewController, WKScriptMessageHandler {

    // 네이티브 statusbar 커버 뷰 (WKWebView 스크롤과 무관하게 항상 최상단에 위치)
    private var statusBarCoverView: UIView?
    // drawer 열릴 때 표시되는 blur 오버레이 (CSS backdrop-blur-sm과 동일한 효과)
    private var statusBarBlurView: UIVisualEffectView?

    override func capacitorDidLoad() {
        // navigationDelegate를 덮어쓰면 Capacitor 브릿지가 망가지므로
        // KVO로 URL 변화를 감지해서 히스토리 초기화
        bridge?.webView?.addObserver(self, forKeyPath: #keyPath(WKWebView.url), options: .new, context: nil)
        bridge?.webView?.configuration.userContentController.add(self, name: "themeChange")

        // bounce 스크롤 비활성화
        bridge?.webView?.scrollView.bounces = false

        // 키보드 등장 시 iOS가 WKWebView scrollView를 자동 스크롤하는 것을 방지
        // (willShow + didShow 두 번 처리: iOS가 애니메이션 이후에 다시 조정하는 경우 대비)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(resetScrollOffset),
            name: UIResponder.keyboardWillShowNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(resetScrollOffset),
            name: UIResponder.keyboardDidShowNotification,
            object: nil
        )

        addStatusBarCover()
    }

    // MARK: - Native StatusBar Cover

    private func addStatusBarCover() {
        // 1. 솔리드 컬러 커버 (일반 페이지용)
        let coverView = UIView()
        coverView.isUserInteractionEnabled = false
        coverView.translatesAutoresizingMaskIntoConstraints = false

        // 라이트/다크 모드에 따라 자동 전환 (#ffffff / #121212)
        let lightColor = UIColor.white
        let darkColor = UIColor(red: 0x12 / 255.0, green: 0x12 / 255.0, blue: 0x12 / 255.0, alpha: 1)
        coverView.backgroundColor = UIColor { traits in
            traits.userInterfaceStyle == .dark ? darkColor : lightColor
        }

        // 2. 블러 레이어 (drawer 열릴 때 CSS backdrop-blur-sm 대응)
        //    systemUltraThinMaterial: WKWebView 콘텐츠에 frosted texture만 추가, 색상은 coverView가 담당
        let blurEffect = UIBlurEffect(style: .systemUltraThinMaterial)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.isUserInteractionEnabled = false
        blurView.translatesAutoresizingMaskIntoConstraints = false
        blurView.alpha = 0 // 초기에는 숨김

        // 레이어 순서: WKWebView → blurView (blur texture) → coverView (tint)
        view.addSubview(blurView)  // 먼저 추가 → 하위 레이어
        view.addSubview(coverView) // 나중에 추가 → blurView 위

        let statusBarConstraints: (UIView) -> [NSLayoutConstraint] = { subview in
            [
                subview.topAnchor.constraint(equalTo: self.view.topAnchor),
                subview.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
                subview.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
                // safeAreaLayoutGuide.topAnchor = statusbar 하단 (= safe area 시작점)
                subview.bottomAnchor.constraint(equalTo: self.view.safeAreaLayoutGuide.topAnchor),
            ]
        }
        NSLayoutConstraint.activate(statusBarConstraints(coverView))
        NSLayoutConstraint.activate(statusBarConstraints(blurView))

        statusBarCoverView = coverView
        statusBarBlurView = blurView
    }

    // MARK: - JS→Native Theme Bridge

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "themeChange",
              let theme = message.body as? String else { return }
        DispatchQueue.main.async {
            switch theme {
            case "transparent":
                // drawer 열림 또는 지도 페이지: native 뷰를 렌더링 파이프라인에서 완전히 제거
                // alpha=0이나 .clear는 compositing에 여전히 참여하므로 isHidden으로 완전 제거
                self.statusBarCoverView?.isHidden = true
                self.statusBarBlurView?.isHidden = true
            default:
                // 일반 페이지: 라이트/다크 테마 배경색, native 뷰 복원
                let darkColor = UIColor(
                    red: 0x12 / 255.0,
                    green: 0x12 / 255.0,
                    blue: 0x12 / 255.0,
                    alpha: 1
                )
                self.statusBarCoverView?.isHidden = false
                self.statusBarBlurView?.isHidden = true
                self.statusBarCoverView?.backgroundColor =
                    theme == "dark" ? darkColor : .white
            }
        }
    }

    @objc private func resetScrollOffset() {
        bridge?.webView?.scrollView.setContentOffset(.zero, animated: false)
    }

    override func observeValue(
        forKeyPath keyPath: String?,
        of object: Any?,
        change: [NSKeyValueChangeKey: Any]?,
        context: UnsafeMutableRawPointer?
    ) {
        if keyPath == #keyPath(WKWebView.url) {
            clearExternalHistoryIfNeeded()
        } else {
            super.observeValue(forKeyPath: keyPath, of: object, change: change, context: context)
        }
    }

    private func clearExternalHistoryIfNeeded() {
        guard let webView = bridge?.webView,
              let url = webView.url,
              url.host == "ittda.vercel.app" else { return }

        // OAuth 콜백 처리 중에는 재로드하지 않음
        let path = url.path
        if path.hasPrefix("/oauth") || path.hasPrefix("/auth") { return }

        let hasExternalHistory = webView.backForwardList.backList.contains {
            $0.url.host != "ittda.vercel.app"
        }

        if hasExternalHistory {
            webView.load(URLRequest(url: url))
        }
    }

    deinit {
        bridge?.webView?.removeObserver(self, forKeyPath: #keyPath(WKWebView.url))
        bridge?.webView?.configuration.userContentController.removeScriptMessageHandler(forName: "themeChange")
        NotificationCenter.default.removeObserver(self)
    }
}
