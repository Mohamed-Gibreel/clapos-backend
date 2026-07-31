import * as crypto from 'crypto';

export function deriveTenantSecret(tenantId: string): string {
  const masterKey = process.env.MASTER_SECRET; // Must be strong and private
  if (!masterKey) {
    throw Error('Unable to get master secret');
  }
  return crypto.createHmac('sha256', masterKey).update(tenantId).digest('hex');
}
