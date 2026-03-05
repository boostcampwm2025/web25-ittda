import UIKit
import WebKit
import Capacitor

class ViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        // navigationDelegate를 덮어쓰면 Capacitor 브릿지가 망가지므로
        // KVO로 URL 변화를 감지해서 히스토리 초기화
        bridge?.webView?.addObserver(self, forKeyPath: #keyPath(WKWebView.url), options: .new, context: nil)
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
    }
}
