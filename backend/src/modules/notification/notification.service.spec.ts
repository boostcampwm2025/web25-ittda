import type { Repository } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { NotificationService } from './notification.service';
import { FcmToken } from './entity/fcm-token.entity';

jest.mock('firebase-admin/app', () => ({
  cert: jest.fn((serviceAccount: unknown) => serviceAccount),
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}));

type SendEachQueryBuilder = {
  delete: jest.Mock;
  where: jest.Mock;
  execute: jest.Mock;
};

function createDeleteQueryBuilder(): SendEachQueryBuilder {
  return {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };
}

describe('NotificationService', () => {
  let fcmTokenRepo: {
    upsert: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let sendEach: jest.Mock;
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    fcmTokenRepo = {
      upsert: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    sendEach = jest.fn();
    (getMessaging as jest.Mock).mockReturnValue({ sendEach });

    service = new NotificationService(
      {} as ConfigService,
      fcmTokenRepo as unknown as Repository<FcmToken>,
    );
    // onModuleInit()은 실제 서비스 계정 파일이 필요해 거치지 않고, 초기화된 것처럼 app을 직접 주입한다.
    (service as unknown as { app: App }).app = {} as App;
  });

  describe('onModuleInit', () => {
    it('Base64 서비스 계정으로 Firebase를 초기화한다', () => {
      const serviceAccount = {
        projectId: 'project-1',
        clientEmail: 'firebase@example.com',
        privateKey: 'private-key',
      };
      const configService = {
        get: jest.fn((key: string) =>
          key === 'FIREBASE_SERVICE_ACCOUNT_BASE64'
            ? Buffer.from(JSON.stringify(serviceAccount)).toString('base64')
            : undefined,
        ),
      };
      service = new NotificationService(
        configService as unknown as ConfigService,
        fcmTokenRepo as unknown as Repository<FcmToken>,
      );

      service.onModuleInit();

      expect(cert).toHaveBeenCalledWith(serviceAccount);
      expect(initializeApp).toHaveBeenCalledWith({
        credential: serviceAccount,
      });
    });
  });

  describe('registerToken', () => {
    it('userId+platform 충돌 시 덮어쓰도록 upsert한다', async () => {
      await service.registerToken('user-1', 'token-1', 'web');

      expect(fcmTokenRepo.upsert).toHaveBeenCalledWith(
        { userId: 'user-1', token: 'token-1', platform: 'web' },
        { conflictPaths: ['userId', 'platform'] },
      );
    });
  });

  describe('removeToken', () => {
    it('userId+platform으로 토큰을 삭제한다', async () => {
      await service.removeToken('user-1', 'android');

      expect(fcmTokenRepo.delete).toHaveBeenCalledWith({
        userId: 'user-1',
        platform: 'android',
      });
    });
  });

  describe('sendToUsers', () => {
    it('app이 초기화되지 않았으면 발송을 시도하지 않는다', async () => {
      (service as unknown as { app: App | null }).app = null;

      await service.sendToUsers(['user-1'], 'title', 'body');

      expect(fcmTokenRepo.find).not.toHaveBeenCalled();
    });

    it('대상 유저가 없으면 조회조차 하지 않는다', async () => {
      await service.sendToUsers([], 'title', 'body');

      expect(fcmTokenRepo.find).not.toHaveBeenCalled();
    });

    it('등록된 토큰이 없으면 발송하지 않는다', async () => {
      fcmTokenRepo.find.mockResolvedValue([]);

      await service.sendToUsers(['user-1'], 'title', 'body');

      expect(sendEach).not.toHaveBeenCalled();
    });

    it('웹은 fid 메시지, 안드로이드는 token 메시지로 나눠 보낸다', async () => {
      fcmTokenRepo.find.mockResolvedValue([
        { token: 'web-fid-1', platform: 'web' },
        { token: 'android-token-1', platform: 'android' },
      ]);
      sendEach.mockResolvedValue({
        responses: [{ success: true }, { success: true }],
      });

      await service.sendToUsers(['user-1', 'user-2'], '제목', '본문', {
        postId: 'post-1',
      });

      expect(sendEach).toHaveBeenCalledWith([
        {
          fid: 'web-fid-1',
          data: { title: '제목', body: '본문', postId: 'post-1' },
          webpush: { headers: { Urgency: 'high' } },
        },
        {
          token: 'android-token-1',
          notification: { title: '제목', body: '본문' },
          data: { postId: 'post-1' },
          webpush: { notification: { icon: '/web-app-icon-192x192.png' } },
        },
      ]);
    });

    it('registration-token-not-registered/invalid-argument로 실패한 토큰만 정리한다', async () => {
      fcmTokenRepo.find.mockResolvedValue([
        { token: 'stale-1', platform: 'android' },
        { token: 'other-error-1', platform: 'android' },
        { token: 'valid-1', platform: 'android' },
      ]);
      sendEach.mockResolvedValue({
        responses: [
          {
            success: false,
            error: { code: 'messaging/registration-token-not-registered' },
          },
          {
            success: false,
            error: { code: 'messaging/internal-error' },
          },
          { success: true },
        ],
      });
      const queryBuilder = createDeleteQueryBuilder();
      fcmTokenRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.sendToUsers(['user-1'], 'title', 'body');

      expect(queryBuilder.where).toHaveBeenCalledWith('token IN (:...tokens)', {
        tokens: ['stale-1'],
      });
    });

    it('sendEach이 실패해도 예외를 던지지 않는다', async () => {
      fcmTokenRepo.find.mockResolvedValue([
        { token: 'token-1', platform: 'android' },
      ]);
      sendEach.mockRejectedValue(new Error('network error'));

      await expect(
        service.sendToUsers(['user-1'], 'title', 'body'),
      ).resolves.toBeUndefined();
    });
  });
});
