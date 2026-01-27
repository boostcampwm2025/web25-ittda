import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { MediaAsset, MediaAssetStatus } from './entity/media-asset.entity';
import type { PresignFileRequestDto } from './dto/presign-media.dto';

@Injectable()
export class MediaService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly presignTtlSeconds = 300;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(MediaAsset)
    private readonly mediaAssetRepository: Repository<MediaAsset>,
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

  async resolveUrls(ownerUserId: string, mediaIds: string[]) {
    const assets = await this.mediaAssetRepository.find({
      where: mediaIds.map((id) => ({ id })),
    });
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

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
      if (asset.ownerUserId !== ownerUserId) {
        failed.push({ mediaId, reason: 'FORBIDDEN' });
        continue;
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

  async resolveUrl(ownerUserId: string, mediaId: string) {
    const asset = await this.mediaAssetRepository.findOne({
      where: { id: mediaId },
    });
    if (!asset) {
      return { ok: false as const, reason: 'NOT_FOUND' as const };
    }
    if (asset.ownerUserId !== ownerUserId) {
      return { ok: false as const, reason: 'FORBIDDEN' as const };
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

        asset.status = MediaAssetStatus.READY;
        asset.uploadedAt = new Date();
        asset.etag =
          typeof head.ETag === 'string'
            ? head.ETag.replace(/"/g, '')
            : undefined;
        asset.size =
          typeof head.ContentLength === 'number'
            ? head.ContentLength
            : asset.size;
        asset.mimeType = head.ContentType ?? asset.mimeType;

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

  private buildStorageKey(ownerUserId: string, mediaId: string) {
    return `media/${ownerUserId}/${mediaId}`;
  }
}
