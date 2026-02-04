export const logger = {
  error: (message: string, error?: unknown) => {
    // Sentry는 런타임 에러를 자동으로 잡으므로,
    // try-catch에서 수동으로 보낼 때만 사용

    console.log(error);

    // 개발 환경에서만 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error);
    }
  },
};
