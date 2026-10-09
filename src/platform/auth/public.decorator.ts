import { ExecutionContext, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export function isPublicHttpPath(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }
  const path = url.split('?')[0];
  return /(?:^|\/)api\/v1\/public(?:\/|$)/.test(path) || /(?:^|\/)public\/service-orders(?:\/|$)/.test(path);
}

export function isPublicExecutionContext(context: ExecutionContext): boolean {
  try {
    const request = context.switchToHttp().getRequest<{ originalUrl?: string; url?: string }>();
    return isPublicHttpPath(request?.originalUrl ?? request?.url);
  } catch {
    return false;
  }
}
