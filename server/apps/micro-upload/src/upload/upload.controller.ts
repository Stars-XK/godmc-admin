import { Controller } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ChunkFileDto, ChunkMergeFileDto } from './dto/index';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ResultData } from '@app/common/utils/result';

@Controller()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private restoreFileBuffer(file: any): Express.Multer.File {
    if (file && file.buffer && file.buffer.type === 'Buffer') {
      file.buffer = Buffer.from(file.buffer.data);
    }
    return file;
  }

  @MessagePattern('singleFileUpload')
  async singleFileUpload(@Payload() data: { file: Express.Multer.File }) {
    const file = this.restoreFileBuffer(data.file);
    const res = await this.uploadService.singleFileUpload(file);
    return ResultData.ok(res);
  }

  @MessagePattern('getChunkUploadId')
  getChunkUploadId() {
    return this.uploadService.getChunkUploadId();
  }

  @MessagePattern('chunkFileUpload')
  chunkFileUpload(@Payload() data: { file: Express.Multer.File; body: ChunkFileDto }) {
    const file = this.restoreFileBuffer(data.file);
    return this.uploadService.chunkFileUpload(file, data.body);
  }

  @MessagePattern('chunkMergeFile')
  chunkMergeFile(@Payload() body: ChunkMergeFileDto) {
    return this.uploadService.chunkMergeFile(body);
  }

  @MessagePattern('getChunkUploadResult')
  getChunkUploadResult(@Payload() query: { uploadId: string }) {
    return this.uploadService.getChunkUploadResult(query.uploadId);
  }

  @MessagePattern('getAuthorization')
  getAuthorization(@Payload() query: { key: string }) {
    return this.uploadService.getAuthorization(query.key);
  }
}
