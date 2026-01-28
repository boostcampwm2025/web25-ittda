import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
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
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { User } from '@/modules/user/entity/user.entity';
import type { PresignFileRequestDto } from './dto/presign-media.dto';

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly presignTtlSeconds = 300;
  private readonly maxUploadSizeBytes = 10 * 1024 * 1024;
  private readonly allowedContentTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
  ]);
  private readonly pendingRetentionMs = 7 * 24 * 60 * 60 * 1000;

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
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    const forcePathStyle =
      (this.configService.get<string>('S3_FORCE_PATH_STYLE') ?? 'false') ===
      'true';
    this.bucket = this.configService.get<string>('S3_BUCKET') ?? '';

    this.s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async createPresignedUploads(
    ownerUserId: string,
    files: PresignFileRequestDto[],
  ) {
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
      });
    });

    await this.mediaAssetRepository.save(assets);

    const expiresAt = new Date(
      Date.now() + this.presignTtlSeconds * 1000,
    ).toISOString();

    const items = await Promise.all(
      assets.map(async (asset) => {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: asset.storageKey,
          ContentType: asset.mimeType ?? undefined,
        });
        const uploadUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: this.presignTtlSeconds,
        });
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
        const allowByProfile = publicProfileAccess.has(mediaId);
        if (!allowByDraft && !allowByGroup && !allowByProfile) {
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
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.presignTtlSeconds,
      });
      items.push({ mediaId, url, expiresAt });
    }

    return { items, failed };
  }

  async resolveUrl(requesterId: string, mediaId: string, draftId?: string) {
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
      const allowByProfile = (await this.getPublicProfileAccess([mediaId])).has(
        mediaId,
      );
      if (!allowByDraft && !allowByGroup && !allowByProfile) {
        return { ok: false as const, reason: 'FORBIDDEN' as const };
      }
    }
    if (asset.status !== MediaAssetStatus.READY) {
      return { ok: false as const, reason: 'NOT_READY' as const };
    }

    const expiresAt = new Date(
      Date.now() + this.presignTtlSeconds * 1000,
    ).toISOString();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: asset.storageKey,
    });
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.presignTtlSeconds,
    });
    return { ok: true as const, url, expiresAt };
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
  @Cron('0 3 * * *')
  async cleanupPendingAssets() {
    const cutoff = new Date(Date.now() - this.pendingRetentionMs);
    const expired = await this.mediaAssetRepository.find({
      where: {
        status: MediaAssetStatus.PENDING,
        createdAt: LessThan(cutoff),
      },
    });

    if (expired.length === 0) return;

    await Promise.all(
      expired.map((asset) =>
        this.s3Client
          .send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: asset.storageKey,
            }),
          )
          .catch(() => undefined),
      ),
    );

    await this.mediaAssetRepository.delete(expired.map((asset) => asset.id));
  }

  private buildStorageKey(ownerUserId: string, mediaId: string) {
    return `media/${ownerUserId}/${mediaId}`;
  }
}
