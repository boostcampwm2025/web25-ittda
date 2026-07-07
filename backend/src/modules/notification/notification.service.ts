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
      select: ['token'],
    });

    const tokenValues = tokens.map((t) => t.token);
    if (tokenValues.length === 0) return;

    try {
      const messages = tokenValues.map((token) => ({
        token,
        notification: { title, body },
        ...(data ? { data } : {}),
        webpush: { notification: { icon: '/web-app-icon-192x192.png' } },
      }));
      const response = await getMessaging(this.app).sendEach(messages);

      const failedCount = response.responses.filter((r) => !r.success).length;
      if (failedCount > 0) {
        this.logger.warn(`FCM 발송 실패: ${failedCount}/${tokenValues.length}`);
      }
    } catch (e) {
      this.logger.error('FCM 발송 오류', e);
    }
  }
}
