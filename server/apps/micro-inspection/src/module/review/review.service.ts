import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionReviewEntity } from '@app/common';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(InspectionReviewEntity)
    private readonly reviewRep: Repository<InspectionReviewEntity>,
  ) {}

  async findByTaskId(taskId: number) {
    const reviews = await this.reviewRep.find({ where: { taskId, delFlag: '0' }, order: { reviewedAt: 'DESC' } });
    return ResultData.ok(reviews);
  }
}
