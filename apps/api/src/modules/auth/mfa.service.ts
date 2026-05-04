import { Injectable } from '@nestjs/common';

/**
 * Placeholder service for SDS optional MFA (TOTP per role).
 * Wire verification into JwtStrategy / login once enrollment is implemented.
 */
@Injectable()
export class MfaService {
  isGloballyRequired(): boolean {
    return (
      Boolean(process.env.AUTH_MFA_REQUIRED) &&
      process.env.AUTH_MFA_REQUIRED === 'true'
    );
  }

  /** Future: lookup user.mfaEnabled and role policies. */
  async isEnrollmentRequired(): Promise<boolean> {
    return false;
  }

  /** Future: verify TOTP backup codes. Always false until MFA module ships. */
  async verifyTotpChallenge(): Promise<boolean> {
    return false;
  }
}
