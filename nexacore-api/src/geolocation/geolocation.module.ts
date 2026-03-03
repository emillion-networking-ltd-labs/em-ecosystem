import { Global, Module } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { ImpossibleTravelService } from './impossible-travel.service';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';

@Global()
@Module({
  imports: [AuditModule, MailModule],
  providers: [GeolocationService, ImpossibleTravelService],
  exports: [GeolocationService, ImpossibleTravelService],
})
export class GeolocationModule {}
