import {
  Body,
  Controller,
  ConflictException,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '@/modules/auth/auth.type';
import { MediaService } from './media.service';
import {
  MediaCompleteRequestDto,
  MediaCompleteResponseDto,
  MediaPresignRequestDto,
  MediaPresignResponseDto,
  MediaResolveRequestDto,
  MediaResolveResponseDto,
  MediaResolveSingleResponseDto,
} from './dto/presign-media.dto';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

@UseGuards(JwtAuthGuard)
@ApiTags('media')
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  @ApiWrappedOkResponse({
    type: MediaPresignResponseDto,
    description: 'Returns presigned upload URLs for media assets.',
  })
  async presign(
    @User() user: MyJwtPayload,
    @Body() body: MediaPresignRequestDto,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.mediaService.createPresignedUploads(requesterId, body.files);
  }

  @Post('complete')
  @ApiWrappedOkResponse({
    type: MediaCompleteResponseDto,
    description: 'Confirms uploads and records object metadata.',
  })
  async complete(
    @User() user: MyJwtPayload,
    @Body() body: MediaCompleteRequestDto,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.mediaService.completeUploads(requesterId, body.mediaIds);
  }

  @Post('resolve')
  @ApiWrappedOkResponse({
    type: MediaResolveResponseDto,
    description: 'Returns presigned GET URLs for media assets.',
  })
  async resolveBatch(
    @User() user: MyJwtPayload,
    @Body() body: MediaResolveRequestDto,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }

    return this.mediaService.resolveUrls(
      requesterId,
      body.mediaIds,
      body.draftId,
    );
  }

  @Get(':mediaId/url')
  @ApiWrappedOkResponse({
    type: MediaResolveSingleResponseDto,
    description: 'Returns a presigned GET URL for a media asset.',
  })
  async resolveSingle(
    @User() user: MyJwtPayload,
    @Param('mediaId') mediaId: string,
    @Query('draftId') draftId?: string,
  ) {
    const requesterId = user?.sub;
    if (!requesterId) {
      throw new UnauthorizedException('Access token is required.');
    }

    const result = await this.mediaService.resolveUrl(
      requesterId,
      mediaId,
      draftId,
    );
    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        throw new NotFoundException('Media not found.');
      }
      if (result.reason === 'FORBIDDEN') {
        throw new ForbiddenException('Not allowed to access this media.');
      }
      throw new ConflictException('Media is not ready.');
    }

    return { url: result.url, expiresAt: result.expiresAt };
  }
}
