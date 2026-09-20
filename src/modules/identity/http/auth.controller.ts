import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsString, IsUUID, MinLength } from 'class-validator';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { CurrentRequest } from 'src/platform/http/request-context.decorators';
import { Public } from 'src/platform/auth/public.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';
import { IdentityService } from '../application/identity/identity.service';
import { AuthService } from '../application/auth/auth.service';

class LoginPasswordBody {
  @IsUUID()
  tenantId!: string;

  @IsString()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class RefreshTokenBody {
  @IsString()
  refreshToken!: string;
}

class LogoutBody {
  @IsUUID()
  sessionId!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly identityService: IdentityService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Public()
  @Post('login/password')
  async loginWithPassword(@Body() body: LoginPasswordBody) {
    return this.authService.loginWithPassword(body);
  }

  @Public()
  @Post('token/refresh')
  async refreshToken(@Body() body: RefreshTokenBody) {
    return this.authService.refreshTokens(body);
  }

  @Post('logout')
  async logout(@Body() body: LogoutBody, @CurrentRequest() request: PlatformRequest) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    await this.authService.logout({ sessionId: body.sessionId, actorUserId });
    return { success: true };
  }

  @Get('me')
  async getMe(@CurrentRequest() request: PlatformRequest) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    const tenantId = request.requestContext.authenticatedPrincipal?.tenantId;
    if (!actorUserId || !tenantId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    const user = await this.identityService.getById(actorUserId);
    const effectiveAccess = await this.authorizationService.getEffectiveAccessForUser(tenantId, actorUserId);

    return {
      user,
      effectiveAccess,
      context: {
        tenantId,
        branchId: request.requestContext.requestedBranchId,
      },
    };
  }
}
