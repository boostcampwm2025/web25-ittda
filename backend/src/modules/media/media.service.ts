import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Cron } from '@nestjs/schedule';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { MediaAsset, MediaAssetStatus } from './entity/media-asset.entity';
import { PostDraftMedia } from '@/modules/post/entity/post-draft-media.entity';
import { PostDraft } from '@/modules/post/entity/post-draft.entity';
import { PostMedia } from '@/modules/post/entity/post-media.entity';
import { Post } from '@/modules/post/entity/post.entity';
import { PostContributor } from '@/modules/post/entity/post-contributor.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMonthCover } from '@/modules/group/entity/group-month-cover.entity';
import { User } from '@/modules/user/entity/user.entity';
import { UserMonthCover } from '@/modules/user/entity/user-month-cover.entity';
import type { PresignFileRequestDto } from './dto/presign-media.dto';

type MediaStorageDeletionResult =
  | { id: string; ok: true }
  | { id: string; ok: false; message: string };

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly s3PresignClient: S3Client;
  private readonly bucket: string;
  private readonly s3ConfigValid: boolean;
  private readonly logger = new Logger(MediaService.name);
  private readonly presignTtlSeconds = 300;
  private readonly maxUploadSizeBytes = 10 * 1024 * 1024;
  private readonly allowedContentTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif',
  ]);
  private readonly pendingRetentionMs = 7 * 24 * 60 * 60 * 1000;
  private readonly orphanReadyRetentionMs = 24 * 60 * 60 * 1000;
  private readonly mediaDeletionConcurrency = 5;
  private readonly pendingDeletionBatchSize = 100;
  private readonly maxDeleteErrorLength = 1000;
  private readonly pendingMediaDeletionQueue = new Set<string>();
  private isPendingMediaDeletionFlushScheduled = false;
  private isPendingMediaDeletionWorkerRunning = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
    @InjectRepository(PostDraftMedia)
    private readonly postDraftMediaRepository: Repository<PostDraftMedia>,
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(PostMedia)
    private readonly postMediaRepository: Repository<PostMedia>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostContributor)
    private readonly postContributorRepository: Repository<PostContributor>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMonthCover)
    private readonly groupMonthCoverRepository: Repository<GroupMonthCover>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMonthCover)
    private readonly userMonthCoverRepository: Repository<UserMonthCover>,
  ) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const publicEndpoint =
      this.configService.get<string>('S3_PUBLIC_ENDPOINT') ?? endpoint;
    const region = this.configService.get<string>('S3_REGION') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    const forcePathStyle =
      (this.configService.get<string>('S3_FORCE_PATH_STYLE') ?? 'true') ===
      'true';
    this.bucket = this.configService.get<string>('S3_BUCKET') ?? '';
    this.s3ConfigValid = Boolean(
      endpoint && accessKeyId && secretAccessKey && this.bucket,
    );

    const credentials =
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined;

    this.s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials,
    });

    // Presigned URL 생성 전용 클라이언트: 외부에서 접근 가능한 public endpoint 사용
    // S3_PUBLIC_ENDPOINT가 없으면 s3Client와 동일하게 동작
    this.s3PresignClient = new S3Client({
      region,
      endpoint: publicEndpoint,
      forcePathStyle,
      credentials,
    });
  }

  async createPresignedUploads(
    ownerUserId: string,
    files: PresignFileRequestDto[],
  ) {
    this.ensureS3Config();
    // TODO: presign 단계에서는 요청 값 기반 검증만 가능함(실제 파일은 complete에서 검증).
    // 추후 PUT -> POST 전환 시점에 contentType/size 재검증 로직 추가 필요.
    files.forEach((file) => {
      if (!this.allowedContentTypes.has(file.contentType)) {
        throw new BadRequestException('Invalid contentType.');
      }
      if (file.size !== undefined && file.size > this.maxUploadSizeBytes) {
        throw new BadRequestException('File size exceeds limit.');
      }
    });
    const assets = files.map((file) => {
      const id = randomUUID();
      const storageKey = this.buildStorageKey(ownerUserId, id);
      return this.mediaAssetRepository.create({
        id,
        ownerUserId,
        storageKey,
        status: MediaAssetStatus.PENDING,
        mimeType: file.contentType,
        size: file.size,
        width: file.width,
        height: file.height,
      });
    });

    try {
      await this.mediaAssetRepository.save(assets);
    } catch (err) {
      this.logger.error(
        'DB 저장 실패',
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('파일 메타데이터 저장 실패');
    }

    const expiresAt = new Date(
      Date.now() + this.presignTtlSeconds * 1000,
    ).toISOString();

    const items = await Promise.all(
      assets.map(async (asset, index) => {
        const file = files[index];
        const metadata: Record<string, string> = {};
        if (typeof file.width === 'number') {
          metadata.width = String(file.width);
        }
        if (typeof file.height === 'number') {
          metadata.height = String(file.height);
        }
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: asset.storageKey,
          ContentType: asset.mimeType ?? undefined,
          Metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        let uploadUrl: string;
        try {
          uploadUrl = await getSignedUrl(this.s3PresignClient, command, {
            expiresIn: this.presignTtlSeconds,
          });
        } catch (err) {
          this.logger.error(
            `Presigned URL 생성 실패 (mediaId=${asset.id})`,
            err instanceof Error ? err.stack : String(err),
          );
          throw new InternalServerErrorException('업로드 URL 생성 실패');
        }
        return {
          mediaId: asset.id,
          method: 'PUT' as const,
          uploadUrl,
          expiresAt,
        };
      }),
    );

    return { items };
  }

  async resolveUrls(requesterId: string, mediaIds: string[], draftId?: string) {
    this.ensureS3Config();
    const assets = await this.mediaAssetRepository.find({
      where: mediaIds.map((id) => ({ id })),
    });
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const draftAccess = draftId
      ? await this.getDraftMediaAccess(requesterId, draftId, mediaIds)
      : null;
    // TODO: resolveUrls용 그룹 권한 조회 최적화 필요.
    // - post_media -> posts -> group_members 조인을 한 번의 쿼리로 합치거나,
    // - (requesterId, mediaIds) 기준으로 짧은 캐시를 두는 방식 고려.
    // - mediaIds가 많을 때 쿼리 비용이 커질 수 있으니 제한/배치 처리도 검토.
    const groupAccess = await this.getGroupMediaAccess(requesterId, mediaIds);
    const contributorAccess = await this.getContributorMediaAccess(
      requesterId,
      mediaIds,
    );
    const publicProfileAccess = await this.getPublicProfileAccess(mediaIds);

    const expiresAt = new Date(
      Date.now() + this.presignTtlSeconds * 1000,
    ).toISOString();

    const items: Array<{ mediaId: string; url: string; expiresAt: string }> =
      [];
    const failed: Array<{
      mediaId: string;
      reason: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_READY';
    }> = [];

    for (const mediaId of mediaIds) {
      const asset = assetMap.get(mediaId);
      if (!asset) {
        failed.push({ mediaId, reason: 'NOT_FOUND' });
        continue;
      }
      if (asset.ownerUserId !== requesterId) {
        const allowByDraft = draftAccess?.has(mediaId);
        const allowByGroup = groupAccess.has(mediaId);
        const allowByContributor = contributorAccess.has(mediaId);
        const allowByProfile = publicProfileAccess.has(mediaId);
        if (
          !allowByDraft &&
          !allowByGroup &&
          !allowByContributor &&
          !allowByProfile
        ) {
          failed.push({ mediaId, reason: 'FORBIDDEN' });
          continue;
        }
      }
      if (asset.status !== MediaAssetStatus.READY) {
        failed.push({ mediaId, reason: 'NOT_READY' });
        continue;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: asset.storageKey,
      });
      let url: string;
      try {
        url = await getSignedUrl(this.s3PresignClient, command, {
          expiresIn: this.presignTtlSeconds,
        });
      } catch (err) {
        this.logger.error(
          `Presigned URL 생성 실패 (mediaId=${mediaId})`,
          err instanceof Error ? err.stack : String(err),
        );
        throw new InternalServerErrorException('조회 URL 생성 실패');
      }
      items.push({ mediaId, url, expiresAt });
    }

    return { items, failed };
  }

  async resolveUrl(requesterId: string, mediaId: string, draftId?: string) {
    this.ensureS3Config();
    const asset = await this.mediaAssetRepository.findOne({
      where: { id: mediaId },
    });
    if (!asset) {
      return { ok: false as const, reason: 'NOT_FOUND' as const };
    }
    if (asset.ownerUserId !== requesterId) {
      const allowByDraft = draftId
        ? (
            await this.getDraftMediaAccess(requesterId, draftId, [mediaId])
          )?.has(mediaId)
        : false;
      const allowByGroup = (
        await this.getGroupMediaAccess(requesterId, [mediaId])
      ).has(mediaId);
      const allowByContributor = (
        await this.getContributorMediaAccess(requesterId, [mediaId])
      ).has(mediaId);
      const allowByProfile = (await this.getPublicProfileAccess([mediaId])).has(
        mediaId,
      );
      if (
        !allowByDraft &&
        !allowByGroup &&
        !allowByContributor &&
        !allowByProfile
      ) {
        return { ok: false as const, reason: 'FORBIDDEN' as const };
      }
    }
    if (asset.status !== MediaAssetStatus.READY) {
      return { ok: false as const, reason: 'NOT_READY' as const };
    }

    return this.createResolvedUrl(asset);
  }

  async resolveUrlPublic(mediaId: string) {
    this.ensureS3Config();
    const asset = await this.mediaAssetRepository.findOne({
      where: { id: mediaId },
    });
    if (!asset) return { ok: false as const, reason: 'NOT_FOUND' as const };
    if (asset.status !== MediaAssetStatus.READY)
      return { ok: false as const, reason: 'NOT_READY' as const };

    return this.createResolvedUrl(asset);
  }

  private ensureS3Config() {
    if (this.s3ConfigValid) {
      return;
    }
    this.logger.error('S3 환경 변수 누락 또는 잘못된 설정');
    throw new InternalServerErrorException(
      '스토리지 설정이 올바르지 않습니다.',
    );
  }

  private async createResolvedUrl(asset: MediaAsset) {
    const expiresAt = new Date(
      Date.now() + this.presignTtlSeconds * 1000,
    ).toISOString();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: asset.storageKey,
    });

    try {
      const url = await getSignedUrl(this.s3PresignClient, command, {
        expiresIn: this.presignTtlSeconds,
      });
      return { ok: true as const, url, expiresAt };
    } catch (err) {
      this.logger.error(
        `Presigned URL 생성 실패 (mediaId=${asset.id})`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('조회 URL 생성 실패');
    }
  }

  async collectPostMediaIdsWithManager(
    manager: EntityManager,
    postIds: string[],
  ): Promise<string[]> {
    if (postIds.length === 0) return [];

    const postMediaRows = await manager.getRepository(PostMedia).find({
      where: { postId: In(postIds) },
      select: { mediaId: true },
    });

    return Array.from(
      new Set(postMediaRows.map((row) => row.mediaId).filter(Boolean)),
    );
  }

  async collectDraftMediaIdsWithManager(
    manager: EntityManager,
    draftIds: string[],
  ): Promise<string[]> {
    if (draftIds.length === 0) return [];

    const draftMediaRows = await manager.getRepository(PostDraftMedia).find({
      where: { draftId: In(draftIds) },
      select: { mediaId: true },
    });

    return Array.from(
      new Set(draftMediaRows.map((row) => row.mediaId).filter(Boolean)),
    );
  }

  async collectUserMonthCoverMediaIdsWithManager(
    manager: EntityManager,
    userId: string,
  ): Promise<string[]> {
    const coverRows = await manager.getRepository(UserMonthCover).find({
      where: { userId },
      select: { coverAssetId: true },
    });

    return Array.from(
      new Set(coverRows.map((row) => row.coverAssetId).filter(Boolean)),
    ) as string[];
  }

  async collectGroupScopedMediaIdsWithManager(
    manager: EntityManager,
    groupId: string,
  ): Promise<string[]> {
    const [group, groupMembers, groupMonthCovers] = await Promise.all([
      manager.getRepository(Group).findOne({
        where: { id: groupId },
        select: { coverMediaId: true },
      }),
      manager.getRepository(GroupMember).find({
        where: { groupId },
        select: { profileMediaId: true },
      }),
      manager.getRepository(GroupMonthCover).find({
        where: { groupId },
        select: { coverAssetId: true },
      }),
    ]);

    return Array.from(
      new Set(
        [
          group?.coverMediaId ?? null,
          ...groupMembers.map((member) => member.profileMediaId ?? null),
          ...groupMonthCovers.map((cover) => cover.coverAssetId ?? null),
        ].filter(Boolean),
      ),
    ) as string[];
  }

  async markMediaDeletionCandidatesWithManager(
    manager: EntityManager,
    mediaIds: string[],
  ): Promise<string[]> {
    if (mediaIds.length === 0) {
      return [];
    }

    const uniqueMediaIds = Array.from(new Set(mediaIds));
    const mediaAssetRepo = manager.getRepository(MediaAsset);

    await mediaAssetRepo.update(
      {
        id: In(uniqueMediaIds),
        status: MediaAssetStatus.READY,
      },
      {
        deleteRequestedAt: new Date(),
        deleteRetryCount: 0,
        lastDeleteError: null,
      },
    );

    return uniqueMediaIds;
  }

  deleteMediaAssets(mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) {
      return Promise.resolve();
    }

    this.enqueuePendingMediaDeletionPlans(mediaIds);
    return Promise.resolve();
  }

  private enqueuePendingMediaDeletionPlans(mediaIds: string[]) {
    for (const mediaId of mediaIds) {
      this.pendingMediaDeletionQueue.add(mediaId);
    }

    this.schedulePendingMediaDeletionFlush();
  }

  private schedulePendingMediaDeletionFlush() {
    if (
      this.isPendingMediaDeletionFlushScheduled ||
      this.isPendingMediaDeletionWorkerRunning
    ) {
      return;
    }

    this.isPendingMediaDeletionFlushScheduled = true;
    queueMicrotask(() => {
      this.isPendingMediaDeletionFlushScheduled = false;
      void this.drainPendingMediaDeletionQueue();
    });
  }

  private async drainPendingMediaDeletionQueue(): Promise<void> {
    if (this.isPendingMediaDeletionWorkerRunning) {
      return;
    }

    this.isPendingMediaDeletionWorkerRunning = true;

    try {
      while (this.pendingMediaDeletionQueue.size > 0) {
        const mediaIds = Array.from(
          this.pendingMediaDeletionQueue.values(),
        ).slice(0, this.pendingDeletionBatchSize);
        mediaIds.forEach((mediaId) => {
          this.pendingMediaDeletionQueue.delete(mediaId);
        });
        await this.processPendingMediaDeletionCandidates(mediaIds);
      }
    } catch (error) {
      this.logger.error(
        'Failed to process pending media deletions.',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isPendingMediaDeletionWorkerRunning = false;

      if (this.pendingMediaDeletionQueue.size > 0) {
        this.schedulePendingMediaDeletionFlush();
      }
    }
  }

  private async processPendingMediaDeletionCandidates(
    mediaIds: string[],
  ): Promise<void> {
    if (!this.s3ConfigValid || mediaIds.length === 0) {
      return;
    }

    const assets = await this.mediaAssetRepository.find({
      where: {
        id: In(mediaIds),
        status: MediaAssetStatus.READY,
        deleteRequestedAt: Not(IsNull()),
      },
      select: {
        id: true,
        storageKey: true,
      },
    });

    if (assets.length === 0) {
      return;
    }

    const assetIds = assets.map((asset) => asset.id);
    const referencedMediaIds = await this.collectReferencedMediaIds(assetIds);
    const reactivatedIds = assetIds.filter((id) => referencedMediaIds.has(id));

    if (reactivatedIds.length > 0) {
      await this.mediaAssetRepository.update(
        { id: In(reactivatedIds) },
        {
          deleteRequestedAt: null,
          deleteRetryCount: 0,
          lastDeleteError: null,
        },
      );
    }

    const orphanAssets = assets.filter(
      (asset) => !referencedMediaIds.has(asset.id),
    );

    if (orphanAssets.length === 0) {
      return;
    }

    const deletionResults =
      await this.deleteMediaAssetsFromStorage(orphanAssets);
    const deletedAssetIds = deletionResults
      .filter((result): result is { id: string; ok: true } => result.ok)
      .map((result) => result.id);
    const failedDeletions = deletionResults.filter(
      (result): result is { id: string; ok: false; message: string } =>
        !result.ok,
    );

    if (deletedAssetIds.length > 0) {
      await this.mediaAssetRepository.delete(deletedAssetIds);
    }

    if (failedDeletions.length === 0) {
      return;
    }

    await Promise.all(
      failedDeletions.map(async ({ id, message }) => {
        this.logger.warn(
          `Failed to delete media from storage (mediaId=${id}): ${message}`,
        );
        await this.mediaAssetRepository.increment(
          { id },
          'deleteRetryCount',
          1,
        );
        await this.mediaAssetRepository.update(
          { id },
          {
            lastDeleteError: this.truncateDeleteError(message),
          },
        );
      }),
    );
  }

  private async deleteMediaAssetsFromStorage(
    assets: Array<Pick<MediaAsset, 'id' | 'storageKey'>>,
  ): Promise<MediaStorageDeletionResult[]> {
    const results: MediaStorageDeletionResult[] = [];

    for (
      let index = 0;
      index < assets.length;
      index += this.mediaDeletionConcurrency
    ) {
      const chunk = assets.slice(index, index + this.mediaDeletionConcurrency);
      const chunkResults = await Promise.all(
        chunk.map(async (asset) => {
          try {
            await this.s3Client.send(
              new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: asset.storageKey,
              }),
            );
            return { id: asset.id, ok: true } as const;
          } catch (error) {
            return {
              id: asset.id,
              ok: false as const,
              message: error instanceof Error ? error.message : 'unknown error',
            };
          }
        }),
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private truncateDeleteError(message: string) {
    return message.slice(0, this.maxDeleteErrorLength);
  }

  async completeUploads(ownerUserId: string, mediaIds: string[]) {
    const assets = await this.mediaAssetRepository.find({
      where: mediaIds.map((id) => ({ id })),
    });
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    const successIds: string[] = [];
    const failed: Array<{
      mediaId: string;
      reason:
        | 'NOT_FOUND'
        | 'FORBIDDEN'
        | 'NOT_FOUND_IN_STORAGE'
        | 'HEAD_FAILED';
    }> = [];

    for (const mediaId of mediaIds) {
      const asset = assetMap.get(mediaId);
      if (!asset) {
        failed.push({ mediaId, reason: 'NOT_FOUND' });
        continue;
      }
      if (asset.ownerUserId !== ownerUserId) {
        failed.push({ mediaId, reason: 'FORBIDDEN' });
        continue;
      }

      try {
        const head = await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucket,
            Key: asset.storageKey,
          }),
        );
        const headSize =
          typeof head.ContentLength === 'number'
            ? head.ContentLength
            : undefined;
        const headType = head.ContentType ?? undefined;
        const headWidth = head.Metadata?.width;
        const headHeight = head.Metadata?.height;

        if (headType && !this.allowedContentTypes.has(headType)) {
          asset.status = MediaAssetStatus.FAILED;
          await this.mediaAssetRepository.save(asset);
          failed.push({ mediaId, reason: 'HEAD_FAILED' });
          continue;
        }
        if (headSize !== undefined && headSize > this.maxUploadSizeBytes) {
          asset.status = MediaAssetStatus.FAILED;
          await this.mediaAssetRepository.save(asset);
          failed.push({ mediaId, reason: 'HEAD_FAILED' });
          continue;
        }

        asset.status = MediaAssetStatus.READY;
        asset.uploadedAt = new Date();
        asset.etag =
          typeof head.ETag === 'string'
            ? head.ETag.replace(/"/g, '')
            : undefined;
        asset.size = headSize !== undefined ? headSize : asset.size;
        asset.mimeType = headType ?? asset.mimeType;
        if (headWidth) {
          const parsedWidth = Number.parseInt(headWidth, 10);
          if (Number.isFinite(parsedWidth) && parsedWidth > 0) {
            asset.width = parsedWidth;
          }
        }
        if (headHeight) {
          const parsedHeight = Number.parseInt(headHeight, 10);
          if (Number.isFinite(parsedHeight) && parsedHeight > 0) {
            asset.height = parsedHeight;
          }
        }

        await this.mediaAssetRepository.save(asset);
        successIds.push(mediaId);
      } catch (error) {
        const name = (error as { name?: string }).name;
        if (name === 'NotFound' || name === 'NoSuchKey') {
          failed.push({ mediaId, reason: 'NOT_FOUND_IN_STORAGE' });
        } else {
          failed.push({ mediaId, reason: 'HEAD_FAILED' });
        }
      }
    }

    return { successIds, failed };
  }

  private async getDraftMediaAccess(
    requesterId: string,
    draftId: string,
    mediaIds: string[],
  ) {
    const draft = await this.postDraftRepository.findOne({
      where: { id: draftId, isActive: true },
      select: { id: true, groupId: true },
    });
    if (!draft?.groupId) return null;

    const member = await this.groupMemberRepository.findOne({
      where: { groupId: draft.groupId, userId: requesterId },
      select: { id: true },
    });
    if (!member) return null;

    const links = await this.postDraftMediaRepository.find({
      where: { draftId, mediaId: In(mediaIds) },
      select: { mediaId: true },
    });
    return new Set(links.map((link) => link.mediaId));
  }

  private async getGroupMediaAccess(requesterId: string, mediaIds: string[]) {
    const links = await this.postMediaRepository.find({
      where: { mediaId: In(mediaIds) },
      select: { mediaId: true, postId: true },
    });
    if (links.length === 0) return new Set<string>();

    const postIds = Array.from(new Set(links.map((link) => link.postId)));
    const posts = await this.postRepository.find({
      where: postIds.map((id) => ({ id })),
      select: { id: true, groupId: true },
    });
    const groupIds = Array.from(
      new Set(posts.map((post) => post.groupId).filter(Boolean) as string[]),
    );
    if (groupIds.length === 0) return new Set<string>();

    const members = await this.groupMemberRepository.find({
      where: groupIds.map((groupId) => ({ groupId, userId: requesterId })),
      select: { groupId: true },
    });
    const allowedGroupIds = new Set(members.map((member) => member.groupId));
    if (allowedGroupIds.size === 0) return new Set<string>();

    const allowedPostIds = new Set(
      posts
        .filter((post) => post.groupId && allowedGroupIds.has(post.groupId))
        .map((post) => post.id),
    );
    const allowed = new Set<string>();
    links.forEach((link) => {
      if (allowedPostIds.has(link.postId)) {
        allowed.add(link.mediaId);
      }
    });
    return allowed;
  }

  private async getContributorMediaAccess(
    requesterId: string,
    mediaIds: string[],
  ) {
    const links = await this.postMediaRepository.find({
      where: { mediaId: In(mediaIds) },
      select: { mediaId: true, postId: true },
    });
    if (links.length === 0) return new Set<string>();

    const postIds = Array.from(new Set(links.map((link) => link.postId)));
    const contributors = await this.postContributorRepository.find({
      where: {
        postId: In(postIds),
        userId: requesterId,
      },
      select: { postId: true },
    });
    const allowedPostIds = new Set(contributors.map((c) => c.postId));
    if (allowedPostIds.size === 0) return new Set<string>();

    const allowed = new Set<string>();
    links.forEach((link) => {
      if (allowedPostIds.has(link.postId)) {
        allowed.add(link.mediaId);
      }
    });
    return allowed;
  }

  private async getPublicProfileAccess(mediaIds: string[]) {
    if (mediaIds.length === 0) return new Set<string>();
    const [users, members] = await Promise.all([
      this.userRepository.find({
        where: { profileImageId: In(mediaIds) },
        select: { profileImageId: true },
      }),
      this.groupMemberRepository.find({
        where: { profileMediaId: In(mediaIds) },
        select: { profileMediaId: true },
      }),
    ]);
    const allowed = new Set<string>();
    users.forEach((user) => {
      if (user.profileImageId) allowed.add(user.profileImageId);
    });
    members.forEach((member) => {
      if (member.profileMediaId) allowed.add(member.profileMediaId);
    });
    return allowed;
  }

  // 매일 오전 3시에 보류 중인 미디어 자산 정리
  @Cron('0 3 * * 1')
  async cleanupPendingAssets() {
    if (!this.s3ConfigValid) {
      this.logger.warn(
        'pending media cleanup skipped because S3 configuration is invalid.',
      );
      return;
    }

    const cutoff = new Date(Date.now() - this.pendingRetentionMs);
    const expired = await this.mediaAssetRepository.find({
      where: {
        status: MediaAssetStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
    });

    if (expired.length === 0) return;

    const deletionResults = await this.deleteMediaAssetsFromStorage(
      expired.map((asset) => ({
        id: asset.id,
        storageKey: asset.storageKey,
      })),
    );
    const deletedAssetIds = deletionResults
      .filter((result): result is { id: string; ok: true } => result.ok)
      .map((result) => result.id);

    deletionResults.forEach((result) => {
      if (!result.ok) {
        this.logger.warn(
          `Failed to delete expired pending media from storage (mediaId=${result.id}): ${result.message}`,
        );
      }
    });

    if (deletedAssetIds.length === 0) return;

    await this.mediaAssetRepository.delete(deletedAssetIds);
  }

  // 매일 오전 4시에 READY 상태 orphan 미디어 자산 정리
  @Cron('0 4 * * *')
  async cleanupOrphanReadyAssets() {
    const cutoff = new Date(Date.now() - this.orphanReadyRetentionMs);
    const candidates = await this.mediaAssetRepository.find({
      where: {
        status: MediaAssetStatus.READY,
        uploadedAt: LessThan(cutoff),
        deleteRequestedAt: IsNull(),
      },
      select: {
        id: true,
        storageKey: true,
      },
    });

    if (candidates.length === 0) return;

    const candidateIds = candidates.map((asset) => asset.id);
    const referencedMediaIds =
      await this.collectReferencedMediaIds(candidateIds);
    const orphanAssets = candidates.filter(
      (asset) => !referencedMediaIds.has(asset.id),
    );

    if (orphanAssets.length === 0) return;

    await this.mediaAssetRepository.update(
      { id: In(orphanAssets.map((asset) => asset.id)) },
      {
        deleteRequestedAt: new Date(),
        deleteRetryCount: 0,
        lastDeleteError: null,
      },
    );
    await this.deleteMediaAssets(orphanAssets.map((asset) => asset.id));
  }

  // 15분마다 삭제 예약된 미디어 자산 재시도
  @Cron('*/15 * * * *')
  async retryPendingMediaAssetDeletions() {
    const pendingAssets = await this.mediaAssetRepository.find({
      where: {
        status: MediaAssetStatus.READY,
        deleteRequestedAt: Not(IsNull()),
      },
      order: {
        deleteRequestedAt: 'ASC',
      },
      select: {
        id: true,
        storageKey: true,
      },
      take: this.pendingDeletionBatchSize,
    });

    if (pendingAssets.length === 0) {
      return;
    }

    await this.deleteMediaAssets(pendingAssets.map((asset) => asset.id));
  }

  private async collectReferencedMediaIds(
    mediaIds: string[],
  ): Promise<Set<string>> {
    if (mediaIds.length === 0) return new Set<string>();

    const [
      postMediaLinks,
      draftMediaLinks,
      users,
      groupMembers,
      groups,
      userMonthCovers,
      groupMonthCovers,
    ] = await Promise.all([
      this.postMediaRepository
        .createQueryBuilder('pm')
        .select('pm.mediaId', 'mediaId')
        .where('pm.mediaId IN (:...mediaIds)', { mediaIds })
        .getRawMany<{ mediaId: string }>(),
      this.postDraftMediaRepository
        .createQueryBuilder('pdm')
        .select('pdm.mediaId', 'mediaId')
        .where('pdm.mediaId IN (:...mediaIds)', { mediaIds })
        .getRawMany<{ mediaId: string }>(),
      this.userRepository.find({
        where: { profileImageId: In(mediaIds) },
        select: { profileImageId: true },
      }),
      this.groupMemberRepository.find({
        where: { profileMediaId: In(mediaIds) },
        select: { profileMediaId: true },
      }),
      this.groupRepository.find({
        where: { coverMediaId: In(mediaIds) },
        select: { coverMediaId: true },
      }),
      this.userMonthCoverRepository.find({
        where: { coverAssetId: In(mediaIds) },
        select: { coverAssetId: true },
      }),
      this.groupMonthCoverRepository.find({
        where: { coverAssetId: In(mediaIds) },
        select: { coverAssetId: true },
      }),
    ]);

    const referenced = new Set<string>();

    postMediaLinks.forEach((link) => referenced.add(link.mediaId));
    draftMediaLinks.forEach((link) => referenced.add(link.mediaId));
    users.forEach((user) => {
      if (user.profileImageId) referenced.add(user.profileImageId);
    });
    groupMembers.forEach((member) => {
      if (member.profileMediaId) referenced.add(member.profileMediaId);
    });
    groups.forEach((group) => {
      if (group.coverMediaId) referenced.add(group.coverMediaId);
    });
    userMonthCovers.forEach((cover) => {
      if (cover.coverAssetId) referenced.add(cover.coverAssetId);
    });
    groupMonthCovers.forEach((cover) => {
      if (cover.coverAssetId) referenced.add(cover.coverAssetId);
    });

    return referenced;
  }

  private buildStorageKey(ownerUserId: string, mediaId: string) {
    return `media/${ownerUserId}/${mediaId}`;
  }
}
