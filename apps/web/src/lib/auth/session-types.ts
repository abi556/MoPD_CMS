export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}
