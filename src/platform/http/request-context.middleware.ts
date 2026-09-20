import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { PlatformRequest } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: PlatformRequest, _response: Response, next: NextFunction): void {
    const authHeader = request.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

    request.requestContext = {
      authToken: bearerToken && bearerToken.length > 0 ? bearerToken : null,
      requestedTenantId: request.header('x-tenant-id')?.trim() ?? null,
      requestedBranchId: request.header('x-branch-id')?.trim() ?? null,
    };

    next();
  }
}
