import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { SysPostEntity } from '@app/common';
@Module({
  imports: [],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
