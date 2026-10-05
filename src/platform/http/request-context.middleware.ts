import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { buildRequestContext, PlatformRequest } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: PlatformRequest, _response: Response, next: NextFunction): void {
    request.requestContext = buildRequestContext(request);
    next();
  }
}
