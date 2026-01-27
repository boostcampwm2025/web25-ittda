import {
  Body,
  Controller,
  Post,
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
}
