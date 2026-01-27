import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

  private buildStorageKey(ownerUserId: string, mediaId: string) {
    return `media/${ownerUserId}/${mediaId}`;
  }
}
