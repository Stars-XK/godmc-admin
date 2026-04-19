import { Controller, Get, Post, Body, Query, UploadedFile, UseInterceptors, HttpCode, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChunkFileDto, ChunkMergeFileDto, FileUploadDto, uploadIdDto } from './dto/index';
import { ResultData } from '@app/common/utils/result';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@ApiTags('通用-文件上传')
@Controller('common/upload')
@ApiBearerAuth('Authorization')
export class UploadController {
  constructor(@Inject('MICRO_UPLOAD') private readonly uploadClient: ClientProxy) {}

  /**
   * 文件上传
   * @param file
   * @returns
   */
  @ApiOperation({
    summary: '文件上传',
  })
  @ApiBody({
    type: FileUploadDto,
    required: true,
  })
  @HttpCode(200)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async singleFileUpload(@UploadedFile() file: Express.Multer.File) {
    const res = await lastValueFrom(this.uploadClient.send('singleFileUpload', { file }));
    return res;
  }

  /**
   * 获取切片上传任务Id
   * @param file
   * @returns
   */
  @ApiOperation({
    summary: '获取切片上传任务Id',
  })
  @ApiBody({
    required: true,
  })
  @HttpCode(200)
  @Get('/chunk/uploadId')
  getChunkUploadId() {
    return this.uploadClient.send('getChunkUploadId', {});
  }

  /**
   * 文件分片上传
   * @param file
   * @returns
   */
  @ApiOperation({
    summary: '文件切片上传',
  })
  @ApiBody({
    required: true,
  })
  @HttpCode(200)
  @Post('/chunk')
  @UseInterceptors(FileInterceptor('file'))
  chunkFileUpload(@UploadedFile() file: Express.Multer.File, @Body() body: ChunkFileDto) {
    return this.uploadClient.send('chunkFileUpload', { file, body });
  }

  /**
   * 文件分片合并
   * @returns
   */
  @ApiOperation({
    summary: '合并切片',
  })
  @ApiBody({
    type: ChunkMergeFileDto,
    required: true,
  })
  @HttpCode(200)
  @Post('/chunk/merge')
  chunkMergeFile(@Body() body: ChunkMergeFileDto) {
    return this.uploadClient.send('chunkMergeFile', body);
  }

  /**
   * 获取切片上传任务结果
   * @param file
   * @returns
   *
   */
  @ApiOperation({
    summary: '获取切片上传结果',
  })
  @ApiQuery({
    type: uploadIdDto,
    required: true,
  })
  @HttpCode(200)
  @Get('/chunk/result')
  getChunkUploadResult(@Query() query: { uploadId: string }) {
    return this.uploadClient.send('getChunkUploadResult', { uploadId: query.uploadId });
  }

  /**
   * 获取cos授权
   * @param query
   */
  @ApiOperation({
    summary: '获取cos上传密钥',
  })
  @ApiBody({
    required: true,
  })
  @Get('/cos/authorization')
  getAuthorization(@Query() query: { key: string }) {
    return this.uploadClient.send('getAuthorization', { key: query.key });
  }
}
