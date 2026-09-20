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

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
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
      message: exception instanceof Error ? exception.message : 'Internal server error',
    });
  }
}
