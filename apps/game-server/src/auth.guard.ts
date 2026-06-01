/**
 * auth.guard.ts — Supabase JWT validation scaffold (v2, RFC 006).
 * Set AUTH_REQUIRED=true when Supabase Auth is wired.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    if (process.env.AUTH_REQUIRED !== 'true') {
      return true;
    }
    const req = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    // v2: verify JWT with Supabase JWKS
    return true;
  }
}
