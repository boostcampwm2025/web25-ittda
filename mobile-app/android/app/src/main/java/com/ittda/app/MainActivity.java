package com.ittda.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // iOS의 statusBarCoverView와 동일한 역할: 상태바 영역을 앱 배경색으로 덮는 네이티브 뷰
    private View statusBarCoverView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 컨텐츠가 status bar / navigation bar 영역으로 확장되도록 설정
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);

        // JS 로드 전 flash 방지: 시스템 다크모드를 기준으로 커버뷰 배경색 + 아이콘 색상 초기 설정
        boolean isDarkMode = (getResources().getConfiguration().uiMode &
                Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;

        addStatusBarCover(isDarkMode);

        WindowInsetsControllerCompat insetsController = new WindowInsetsControllerCompat(
                getWindow(), getWindow().getDecorView()
        );
        insetsController.setAppearanceLightStatusBars(!isDarkMode);

        // WebView 로드 전에 브릿지 등록 (onStart보다 이른 시점 → 타이밍 문제 해소)
        getBridge().getWebView().addJavascriptInterface(new StatusBarBridge(), "AndroidBridge");
    }

    // iOS addStatusBarCover()에 대응: 상태바 높이만큼 View를 DecorView 최상단에 추가
    private void addStatusBarCover(boolean isDarkMode) {
        ViewGroup rootView = (ViewGroup) getWindow().getDecorView();

        statusBarCoverView = new View(this);
        statusBarCoverView.setClickable(false);
        statusBarCoverView.setFocusable(false);
        statusBarCoverView.setBackgroundColor(isDarkMode ? Color.parseColor("#121212") : Color.WHITE);

        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            0 // 실제 높이는 WindowInsets 콜백에서 설정
        );
        rootView.addView(statusBarCoverView, params);

        // 상태바 실제 높이를 insets에서 가져와 적용
        ViewCompat.setOnApplyWindowInsetsListener(statusBarCoverView, (v, insets) -> {
            int statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            ViewGroup.LayoutParams lp = v.getLayoutParams();
            lp.height = statusBarHeight;
            v.setLayoutParams(lp);
            return insets;
        });
    }

    private void applyStatusBarTheme(String theme) {
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
            getWindow(), getWindow().getDecorView()
        );
        switch (theme) {
            case "transparent":
                // 지도 페이지: 커버 뷰 숨김 → 지도 타일이 status bar 아래까지 보임
                getWindow().setStatusBarColor(Color.TRANSPARENT);
                controller.setAppearanceLightStatusBars(false);
                if (statusBarCoverView != null) statusBarCoverView.setVisibility(View.GONE);
                break;
            case "map-overlay":
                // 지도 페이지 + drawer 열림: 커버 뷰 숨기고 반투명 오버레이
                getWindow().setStatusBarColor(Color.argb(102, 0, 0, 0));
                controller.setAppearanceLightStatusBars(false);
                if (statusBarCoverView != null) statusBarCoverView.setVisibility(View.GONE);
                break;
            case "dark":
                // 다크 모드 일반 페이지
                getWindow().setStatusBarColor(Color.parseColor("#121212"));
                controller.setAppearanceLightStatusBars(false);
                if (statusBarCoverView != null) {
                    statusBarCoverView.setBackgroundColor(Color.parseColor("#121212"));
                    statusBarCoverView.setVisibility(View.VISIBLE);
                }
                break;
            default:
                // 라이트 모드 일반 페이지
                getWindow().setStatusBarColor(Color.WHITE);
                controller.setAppearanceLightStatusBars(true);
                if (statusBarCoverView != null) {
                    statusBarCoverView.setBackgroundColor(Color.WHITE);
                    statusBarCoverView.setVisibility(View.VISIBLE);
                }
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
