import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsString, IsUUID, MinLength } from 'class-validator';
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly identityService: IdentityService,
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
  async logout(@CurrentRequest() request: PlatformRequest) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    const sessionId = request.requestContext.authenticatedPrincipal?.sessionId;
    if (!actorUserId || !sessionId) {
      throw new UnauthorizedException('Authenticated session is required.');
    }

    await this.authService.logout({ sessionId, actorUserId });
    return { success: true };
  }

  @Get('me')
  async getMe(@CurrentRequest() request: PlatformRequest) {
    const principal = request.requestContext.authenticatedPrincipal;
    if (!principal) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    const user = await this.identityService.getById(principal.userId);
    if (user.tenantId !== principal.tenantId) {
      throw new UnauthorizedException('Authenticated user is outside the tenant scope.');
    }

    return {
      user,
      effectiveAccess: {
        branchIds: principal.effectiveBranchIds,
        permissions: principal.effectivePermissions,
      },
      context: {
        tenantId: principal.tenantId,
        branchId: request.requestContext.requestedBranchId,
      },
    };
  }
}
