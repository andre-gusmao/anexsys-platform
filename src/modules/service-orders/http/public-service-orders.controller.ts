import { Controller, Get, Header, Headers, Ip, Param, Post, UnauthorizedException } from '@nestjs/common';
import { Public } from 'src/platform/auth/public.decorator';
import { ServiceOrderService } from '../application/service-order/service-order.service';

@Public()
@Controller('public/service-orders')
export class PublicServiceOrdersController {
  constructor(private readonly serviceOrderService: ServiceOrderService) {}

  @Public()
  @Get(':publicToken')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  async getTracking(@Param('publicToken') publicToken: string) {
    return this.serviceOrderService.getPublicTrackingView(publicToken);
  }

  @Public()
  @Post(':publicToken/recebi')
  @Header('X-Robots-Tag', 'noindex, nofollow')
  async confirmRecebi(
    @Param('publicToken') publicToken: string,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
  ) {
    if (!publicToken) {
      throw new UnauthorizedException('O link da OS é obrigatório.');
    }
    return this.serviceOrderService.confirmPublicRecebi(publicToken, { userAgent: userAgent ?? null, ip: ip ?? null });
  }
}
