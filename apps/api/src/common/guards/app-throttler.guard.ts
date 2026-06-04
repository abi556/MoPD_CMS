import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (process.env.DISABLE_THROTTLE === 'true') {
      return true;
    }
    return super.shouldSkip(context);
  }

  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { id?: string } | undefined;
    if (user?.id) {
      return Promise.resolve(`user:${user.id}`);
    }

    const forwarded = req.headers as { 'x-forwarded-for'?: string } | undefined;
    const forwardedIp = forwarded?.['x-forwarded-for']?.split(',')[0]?.trim();

    const ips = req.ips as string[] | undefined;
    const ip =
      forwardedIp ||
      (ips && ips.length > 0 ? ips[0] : undefined) ||
      (req.ip as string | undefined) ||
      (req['socket'] as { remoteAddress?: string } | undefined)?.remoteAddress;

    return Promise.resolve(`ip:${ip ?? 'unknown'}`);
  }

  protected getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const http = context.switchToHttp();
    return {
      req: http.getRequest<Record<string, unknown>>(),
      res: http.getResponse<Record<string, unknown>>(),
    };
  }
}
