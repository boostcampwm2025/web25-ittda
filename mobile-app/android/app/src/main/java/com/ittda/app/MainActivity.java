package com.ittda.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // iOS의 statusBarCoverView와 동일한 역할: 상태바 영역을 앱 배경색으로 덮는 네이티브 뷰
    private View statusBarCoverView;

    // JS가 appReady()를 호출할 때까지 네이티브 스플래시를 유지
    private volatile boolean appReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !appReady);

        // JS가 appReady()를 호출하지 못하는 경우 최대 5초 후 강제 해제
        new Handler(Looper.getMainLooper()).postDelayed(() -> appReady = true, 5000);

        super.onCreate(savedInstanceState);
        // 컨텐츠가 status bar / navigation bar 영역으로 확장되도록 설정
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        // JS 로드 전 flash 방지: 시스템 다크모드를 기준으로 커버뷰 배경색 + 아이콘 색상 초기 설정
        boolean isDarkMode = (getResources().getConfiguration().uiMode &
                Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;

        // 스플래시 fadeOut 시 WebView 뒤에 보이는 window background를 앱 배경색으로 설정
        // (DayNight 테마가 다크모드에서 검정으로 설정하는 것을 재정의)
        int appBgColor = isDarkMode ? Color.parseColor("#121212") : Color.WHITE;
        getWindow().getDecorView().setBackgroundColor(appBgColor);

        // WebView 자체 배경도 동일하게 설정 (WebView 로드 전 잠깐 노출되는 영역)
        getBridge().getWebView().setBackgroundColor(appBgColor);

        // 인라인 스크립트가 getStatusBarHeightDp()를 호출할 때 올바른 값을 반환하도록
        // JS bridge 등록 전에 Android 시스템 리소스에서 동기적으로 상태바 높이 초기화
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            statusBarHeightPx = getResources().getDimensionPixelSize(resourceId);
        }

        addStatusBarCover(isDarkMode);

        WindowInsetsControllerCompat insetsController =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.setAppearanceLightStatusBars(!isDarkMode);
        insetsController.setAppearanceLightNavigationBars(!isDarkMode);

        // WebView 로드 전에 브릿지 등록 (onStart보다 이른 시점 → 타이밍 문제 해소)
        getBridge().getWebView().addJavascriptInterface(new StatusBarBridge(), "AndroidBridge");
    }

    // 상태바 높이 (px): insets 콜백에서 설정, JS bridge에서 읽음
    private volatile int statusBarHeightPx = 0;

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
            // 0이면 CSS 변수를 0으로 덮어쓰지 않음:
            // evaluateJavascript로 --cap-status-bar-height=0px을 세팅하면
            // env(safe-area-inset-top) fallback이 0으로 override되어 헤더가 상태바 뒤로 들어가는 버그 방지
            if (statusBarHeight > 0) {
                statusBarHeightPx = statusBarHeight;
                float density = getResources().getDisplayMetrics().density;
                float dp = statusBarHeight / density;
                String js = "document.documentElement.style.setProperty('--cap-status-bar-height','" + dp + "px');";
                getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
            }
            return insets;
        });
    }

    private void applyStatusBarTheme(String theme) {
        // 배경색·가시성: 즉시 적용
        // 아이콘 색상: 다음 프레임으로 미룸 (같은 프레임 내 Android/Capacitor 덮어쓰기 방지)
        final boolean lightBars;
        switch (theme) {
            case "transparent":
                getWindow().setStatusBarColor(Color.TRANSPARENT);
                if (statusBarCoverView != null) statusBarCoverView.setVisibility(View.GONE);
                lightBars = false;
                break;
            case "map-overlay":
                getWindow().setStatusBarColor(Color.argb(102, 0, 0, 0));
                if (statusBarCoverView != null) statusBarCoverView.setVisibility(View.GONE);
                lightBars = false;
                break;
            case "dark":
                getWindow().setStatusBarColor(Color.parseColor("#121212"));
                if (statusBarCoverView != null) {
                    statusBarCoverView.setBackgroundColor(Color.parseColor("#121212"));
                    statusBarCoverView.setVisibility(View.VISIBLE);
                }
                lightBars = false;
                break;
            default:
                getWindow().setStatusBarColor(Color.WHITE);
                if (statusBarCoverView != null) {
                    statusBarCoverView.setBackgroundColor(Color.WHITE);
                    statusBarCoverView.setVisibility(View.VISIBLE);
                }
                lightBars = true;
                break;
        }
        WindowInsetsControllerCompat insetsController =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.setAppearanceLightStatusBars(lightBars);
        insetsController.setAppearanceLightNavigationBars(lightBars);
    }

    private class StatusBarBridge {
        @JavascriptInterface
        public void themeChange(String theme) {
            runOnUiThread(() -> applyStatusBarTheme(theme));
        }

        @JavascriptInterface
        public void appReady() {
            appReady = true;
        }

        // 상태바 높이를 CSS dp 단위로 반환 (env(safe-area-inset-top) 미지원 시 fallback용)
        @JavascriptInterface
        public float getStatusBarHeightDp() {
            if (statusBarHeightPx <= 0) return 0f;
            return statusBarHeightPx / getResources().getDisplayMetrics().density;
        }
    }
}
