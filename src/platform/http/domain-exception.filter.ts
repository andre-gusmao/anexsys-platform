import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationFailedError } from 'src/shared/errors/authentication-failed.error';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest<{ method?: string; url?: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const friendlyMessage = this.getFriendlyHttpMessage(status, exception.getResponse(), request);
      response.status(status).json(friendlyMessage ? { message: friendlyMessage } : exception.getResponse());
      return;
    }

    if (exception instanceof DomainValidationError || exception instanceof BadRequestException) {
      response.status(HttpStatus.BAD_REQUEST).json({ message: exception.message });
      return;
    }

    if (exception instanceof EntityNotFoundError || exception instanceof NotFoundException) {
      response.status(HttpStatus.NOT_FOUND).json({ message: exception.message });
      return;
    }

    if (exception instanceof AuthenticationFailedError || exception instanceof UnauthorizedException) {
      response.status(HttpStatus.UNAUTHORIZED).json({ message: exception.message });
      return;
    }

    if (exception instanceof ForbiddenException) {
      response.status(HttpStatus.FORBIDDEN).json({ message: exception.message });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message:
        exception instanceof Error && /getAllAndOverride|assertAllowed|Cannot read properties of undefined/.test(exception.message)
          ? 'O servidor não concluiu a operação. Pare o processo da porta 3000, rode npm run start:dev outra vez e tente de novo.'
          : exception instanceof Error
            ? exception.message
            : 'Internal server error',
    });
  }

  private getFriendlyHttpMessage(
    status: number,
    payload: unknown,
    request: { method?: string; url?: string } | undefined,
  ): string | null {
    if (status !== HttpStatus.BAD_REQUEST || !payload || typeof payload !== 'object') {
      return null;
    }

    const message = (payload as { message?: unknown }).message;
    if (!Array.isArray(message)) {
      return null;
    }

    if (request?.method === 'POST' && request.url?.includes('/customers')) {
      return 'Customer could not be saved. Some registration fields are missing or invalid. Review name, contact, address, and document information, then try again.';
    }

    return 'The request could not be completed. Some informed fields are missing or invalid. Review the data and try again.';
  }
}
