import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PostService } from './post.service';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @MessagePattern('system.post.create')
  create(@Payload() createPostDto: any) {
    return this.postService.create(createPostDto);
  }

  @MessagePattern('system.post.findAll')
  findAll(@Payload() query: any) {
    return this.postService.findAll(query);
  }

  @MessagePattern('system.post.findOne')
  findOne(@Payload() postId: any) {
    return this.postService.findOne(postId);
  }

  @MessagePattern('system.post.update')
  update(@Payload() updatePostDto: any) {
    return this.postService.update(updatePostDto);
  }

  @MessagePattern('system.post.remove')
  remove(@Payload() postIds: any) {
    return this.postService.remove(postIds);
  }

}
