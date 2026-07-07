import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  initializeApp,
  cert,
  type App,
  ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { resolve } from 'path';
import { FcmToken, type FcmPlatform } from './entity/fcm-token.entity';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private app: App | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
  ) {}

  onModuleInit() {
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );
    if (!serviceAccountPath) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH가 설정되지 않아 FCM을 비활성화합니다.',
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(
        resolve(serviceAccountPath),
      ) as ServiceAccount;
      this.app = initializeApp({ credential: cert(serviceAccount) });
      this.logger.log('Firebase Admin SDK 초기화 완료');
    } catch (e) {
      this.logger.error('Firebase Admin SDK 초기화 실패', e);
    }
  }

  async registerToken(
    userId: string,
    token: string,
    platform: FcmPlatform,
  ): Promise<void> {
    await this.fcmTokenRepo.upsert(
      { userId, token, platform },
      { conflictPaths: ['userId', 'platform'] },
    );
  }

  async removeToken(userId: string, platform: FcmPlatform): Promise<void> {
    await this.fcmTokenRepo.delete({ userId, platform });
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.app || userIds.length === 0) return;

    const tokens = await this.fcmTokenRepo.find({
      where: userIds.map((userId) => ({ userId })),
      select: ['token', 'platform'],
    });

    if (tokens.length === 0) return;

    try {
      // 웹: data-only 메시지 → Firebase가 자동 표시하지 않고 SW onBackgroundMessage에서 처리.
      //     notification 필드가 있으면 Firebase가 자동 표시(FCM_MSG 래핑)와 onBackgroundMessage 둘 다 호출해
      //     알림이 중복되고 notificationclick에서 data 파싱이 깨지는 문제가 발생함.
      // 안드로이드: notification 필드 필요 (네이티브 FCM이 시스템 알림 표시에 사용).
      const messages = tokens.map(({ token, platform }) =>
        platform === 'web'
          ? {
              token,
              data: { title, body, ...(data ?? {}) },
              webpush: { headers: { Urgency: 'high' } },
            }
          : {
              token,
              notification: { title, body },
              ...(data ? { data } : {}),
              webpush: { notification: { icon: '/web-app-icon-192x192.png' } },
            },
      );
      const response = await getMessaging(this.app).sendEach(messages);

      const staleTokens = response.responses
        .map((r, i) => ({ ...r, token: messages[i].token }))
        .filter(
          (r) =>
            !r.success &&
            (r.error?.code === 'messaging/registration-token-not-registered' ||
              r.error?.code === 'messaging/invalid-argument'),
        )
        .map((r) => r.token);

      if (staleTokens.length > 0) {
        await this.fcmTokenRepo
          .createQueryBuilder()
          .delete()
          .where('token IN (:...tokens)', { tokens: staleTokens })
          .execute();
        this.logger.log(`만료 FCM 토큰 ${staleTokens.length}개 삭제`);
      }

      const failedCount = response.responses.filter((r) => !r.success).length;
      if (failedCount > 0) {
        this.logger.warn(`FCM 발송 실패: ${failedCount}/${messages.length}`);
      }
    } catch (e) {
      this.logger.error('FCM 발송 오류', e);
    }
  }
}
