import { createHash } from 'crypto';

export function hashDeviceToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
