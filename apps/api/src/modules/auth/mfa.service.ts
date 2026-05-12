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
  isEnrollmentRequired(): Promise<boolean> {
    return Promise.resolve(false);
  }

  /** Future: verify TOTP backup codes. Always false until MFA module ships. */
  verifyTotpChallenge(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
