import { IsObject, IsString } from 'class-validator';

export class PasskeyLoginVerifyDto {
  @IsObject()
  credential: Record<string, unknown>;

  @IsString()
  challengeId: string;
}
