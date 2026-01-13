import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  createPost(ownerUserId: string, dto: CreatePostDto) {
    void ownerUserId;
    void dto;
    throw new NotImplementedException('PostService.createPost is not ready');
  }

  findOne(postId: string) {
    void postId;
    throw new NotImplementedException('PostService.findOne is not ready');
  }
}
