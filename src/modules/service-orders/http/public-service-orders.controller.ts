import { Controller, Get, Headers, Ip, Param, ParseUUIDPipe, Post, UnauthorizedException } from '@nestjs/common';
import { Public } from 'src/platform/auth/public.decorator';
import { ServiceOrderService } from '../application/service-order/service-order.service';

@Public()
@Controller('public/service-orders')
export class PublicServiceOrdersController {
  constructor(private readonly serviceOrderService: ServiceOrderService) {}

  @Get(':publicToken')
  async getTracking(@Param('publicToken', new ParseUUIDPipe()) publicToken: string) {
    return this.serviceOrderService.getPublicTrackingView(publicToken);
  }

  @Post(':publicToken/recebi')
  async confirmRecebi(
    @Param('publicToken', new ParseUUIDPipe()) publicToken: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
  ) {
    if (!publicToken) {
      throw new UnauthorizedException('O link da OS é obrigatório.');
    }
    return this.serviceOrderService.confirmPublicRecebi(publicToken, { userAgent: userAgent ?? null, ip: ip ?? null });
  }
}
