import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('inspection_photo', {
  comment: '【巡检管理】巡检照片管理表',
})
export class InspectionPhotoEntity extends BaseEntity {
  @ApiProperty({ type: Number, description: '照片ID' })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', comment: '主键' })
  public id: number;

  @ApiProperty({ type: Number, description: '关联巡检记录ID' })
  @Column({ type: 'bigint', name: 'record_id', nullable: true, comment: '关联巡检记录ID' })
  public recordId: number;

  @ApiProperty({ type: Number, description: '关联任务ID' })
  @Column({ type: 'bigint', name: 'task_id', nullable: true, comment: '关联任务ID' })
  public taskId: number;

  @ApiProperty({ type: Number, description: '关联上传记录ID' })
  @Column({ type: 'bigint', name: 'upload_id', nullable: true, comment: '关联上传记录ID' })
  public uploadId: number;

  @ApiProperty({ type: String, description: '照片URL' })
  @Column({ type: 'varchar', name: 'photo_url', length: 500, comment: '照片URL' })
  public photoUrl: string;

  @ApiProperty({ type: String, description: '缩略图URL' })
  @Column({ type: 'varchar', name: 'thumbnail_url', length: 500, default: '', comment: '缩略图URL' })
  public thumbnailUrl: string;

  @ApiProperty({ type: String, description: '照片类型（checkpoint/issue/signature/other）' })
  @Column({ type: 'varchar', name: 'photo_type', length: 20, default: 'checkpoint', comment: '照片类型' })
  public photoType: string;

  @ApiProperty({ type: Object, description: '照片标注信息(JSON)' })
  @Column({ type: 'json', name: 'annotation', nullable: true, comment: '照片标注信息' })
  public annotation: any;

  @ApiProperty({ type: String, description: '经度' })
  @Column({ type: 'varchar', name: 'lng', length: 30, default: '', comment: '经度' })
  public lng: string;

  @ApiProperty({ type: String, description: '纬度' })
  @Column({ type: 'varchar', name: 'lat', length: 30, default: '', comment: '纬度' })
  public lat: string;

  @ApiProperty({ type: Number, description: '照片大小(字节)' })
  @Column({ type: 'int', name: 'file_size', default: 0, comment: '照片大小(字节)' })
  public fileSize: number;

  @ApiProperty({ type: Number, description: '排序号' })
  @Column({ type: 'int', name: 'sort_order', default: 0, comment: '排序号' })
  public sortOrder: number;
}
