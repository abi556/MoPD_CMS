export interface JwtUser {
  id: string;
  email: string;
  roles: string[];
  jti?: string;
  exp?: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  jti: string;
  exp?: number;
}
