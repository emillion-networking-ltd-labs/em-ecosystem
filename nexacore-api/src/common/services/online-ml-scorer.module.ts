import { Module } from '@nestjs/common';
import { OnlineMlScorerService } from './online-ml-scorer.service';
import { OnlineMlScorerInterceptor } from '../interceptors/online-ml-scorer.interceptor';

@Module({
  providers: [OnlineMlScorerService, OnlineMlScorerInterceptor],
  exports: [OnlineMlScorerService, OnlineMlScorerInterceptor],
})
export class OnlineMlScorerModule {}
