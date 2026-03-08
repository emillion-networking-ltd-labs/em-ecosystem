import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { TokenDenyListService } from '../token-deny-list.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { SafeUser, toSafeUser } from '../../users/entities/user.entity';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenDenyListService: TokenDenyListService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      issuer: 'nexacore-api',
      audience: 'nexacore-api',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<SafeUser> {
    const isDenied = await this.tokenDenyListService.isDenied(payload.jti, payload.sub, payload.iat);
    if (isDenied) {
      throw new UnauthorizedException(ErrorMessages.auth.TOKEN_REVOKED);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    if (!user.isActive) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }
    return toSafeUser(user);
  }
}
