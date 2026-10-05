import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/platform/auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
