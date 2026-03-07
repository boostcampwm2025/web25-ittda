import UIKit
import WebKit
import Capacitor

class ViewController: CAPBridgeViewController, WKScriptMessageHandler {

    // 네이티브 statusbar 커버 뷰 (WKWebView 스크롤과 무관하게 항상 최상단에 위치)
    private var statusBarCoverView: UIView?

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
        let coverView = UIView()
        coverView.isUserInteractionEnabled = false
        coverView.translatesAutoresizingMaskIntoConstraints = false

        // 라이트/다크 모드에 따라 자동 전환 (#ffffff / #121212)
        let lightColor = UIColor.white
        let darkColor = UIColor(red: 0x12 / 255.0, green: 0x12 / 255.0, blue: 0x12 / 255.0, alpha: 1)
        coverView.backgroundColor = UIColor { traits in
            traits.userInterfaceStyle == .dark ? darkColor : lightColor
        }

        view.addSubview(coverView)
        view.bringSubviewToFront(coverView)

        NSLayoutConstraint.activate([
            coverView.topAnchor.constraint(equalTo: view.topAnchor),
            coverView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            coverView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            // safeAreaLayoutGuide.topAnchor = statusbar 하단 (= safe area 시작점)
            coverView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
        ])

        statusBarCoverView = coverView
    }

    // MARK: - JS→Native Theme Bridge

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "themeChange",
              let theme = message.body as? String else { return }
        DispatchQueue.main.async {
            let darkColor = UIColor(
                red: 0x12 / 255.0,
                green: 0x12 / 255.0,
                blue: 0x12 / 255.0,
                alpha: 1
            )
            self.statusBarCoverView?.backgroundColor =
                theme == "dark" ? darkColor : .white
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
