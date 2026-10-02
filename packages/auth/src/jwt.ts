import type { AuthTokenPayload, AuthUser } from './types.ts';

export class TokenService {
  private secret: string;
  private issuer: string;

  constructor() {
    this.secret = process.env.AUTH_JWT_SECRET || 'dev_secret_jwt_key_bcip_minimum_32_characters';
    this.issuer = process.env.AUTH_ISSUER || 'bcip.ainubis.platform';
  }

  public generateDummyToken(user: AuthUser): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      schemeIds: user.schemeIds,
      iss: this.issuer,
      aud: 'bcip-api',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    // Base64Url token abstraction
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = Buffer.from('mock_signature').toString('base64url');
    return `${header}.${body}.${signature}`;
  }

  public verifyToken(token: string): AuthTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      return JSON.parse(payloadJson) as AuthTokenPayload;
    } catch {
      return null;
    }
  }
}

export const tokenService = new TokenService();
