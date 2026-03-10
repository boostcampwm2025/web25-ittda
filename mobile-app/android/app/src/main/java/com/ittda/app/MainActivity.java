package com.ittda.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 컨텐츠가 status bar 영역으로 확장되도록 설정
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
    }

    @Override
    public void onStart() {
        super.onStart();
        // WebView에 Android 브릿지 등록 (JS: window.AndroidBridge.themeChange(theme))
        getBridge().getWebView().addJavascriptInterface(new StatusBarBridge(), "AndroidBridge");
    }

    private void applyStatusBarTheme(String theme) {
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
            getWindow(), getWindow().getDecorView()
        );
        switch (theme) {
            case "transparent":
                // 지도 페이지: 투명 (지도 타일이 status bar 아래에 보임)
                getWindow().setStatusBarColor(Color.TRANSPARENT);
                controller.setAppearanceLightStatusBars(false); // 밝은 아이콘
                break;
            case "map-overlay":
                // 지도 페이지 + drawer 열림: 반투명 어두운 오버레이 (~40%)
                getWindow().setStatusBarColor(Color.argb(102, 0, 0, 0));
                controller.setAppearanceLightStatusBars(false); // 밝은 아이콘
                break;
            case "dark":
                // 다크 모드 일반 페이지
                getWindow().setStatusBarColor(Color.parseColor("#121212"));
                controller.setAppearanceLightStatusBars(false); // 밝은 아이콘
                break;
            default:
                // 라이트 모드 일반 페이지
                getWindow().setStatusBarColor(Color.WHITE);
                controller.setAppearanceLightStatusBars(true); // 어두운 아이콘
                break;
        }
    }

    private class StatusBarBridge {
        @JavascriptInterface
        public void themeChange(String theme) {
            runOnUiThread(() -> applyStatusBarTheme(theme));
        }
    }
}
