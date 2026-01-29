// _lib/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

worker.start({
  onUnhandledRequest: (req, print) => {
    // Next-Auth 및 Next.js 데이터 요청은 가로채지 않음
    if (req.url.includes('/api/auth') || req.url.includes('_rsc')) {
      return;
    }
    print.warning();
  },
});
