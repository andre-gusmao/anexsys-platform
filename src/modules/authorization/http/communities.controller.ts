import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Permissions } from 'src/platform/auth/permissions.decorator';
import { CurrentRequest, CurrentTenantId } from 'src/platform/http/request-context.decorators';
import { PlatformRequest } from 'src/platform/http/request-context';
import { AuthorizationService } from '../application/authorization/authorization.service';

class CreateCommunityBody {
  @IsString()
  code!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class AssignCommunityPermissionBody {
  @IsUUID()
  permissionId!: string;
}

class AssignCommunityUserBody {
  @IsUUID()
  userId!: string;
}

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Permissions('communities.read')
  @Get()
  async list(@CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    return this.authorizationService.listCommunities(tenantId);
  }

  @Permissions('communities.write')
  @Post()
  async create(
    @Body() body: CreateCommunityBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    return this.authorizationService.createCommunity({ ...body, tenantId, actorUserId });
  }

  @Permissions('communities.read')
  @Get(':communityId')
  async getById(@Param('communityId', new ParseUUIDPipe()) communityId: string, @CurrentTenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }

    const community = await this.authorizationService.getCommunityById(communityId);
    if (community.tenantId !== tenantId) {
      throw new ForbiddenException('Requested community is outside the authenticated tenant scope.');
    }

    return community;
  }

  @Permissions('communities.write')
  @Post(':communityId/permissions')
  async assignPermission(
    @Param('communityId', new ParseUUIDPipe()) communityId: string,
    @Body() body: AssignCommunityPermissionBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    await this.authorizationService.assignPermissionToCommunity({
      tenantId,
      communityId,
      permissionId: body.permissionId,
      actorUserId,
    });

    return { success: true };
  }

  @Permissions('communities.write')
  @Post(':communityId/users')
  async assignUser(
    @Param('communityId', new ParseUUIDPipe()) communityId: string,
    @Body() body: AssignCommunityUserBody,
    @CurrentTenantId() tenantId: string | null,
    @CurrentRequest() request: PlatformRequest,
  ) {
    const actorUserId = request.requestContext.authenticatedPrincipal?.userId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required.');
    }
    if (!actorUserId) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    await this.authorizationService.assignUserToCommunity({
      tenantId,
      userId: body.userId,
      communityId,
      actorUserId,
    });

    return { success: true };
  }
}
