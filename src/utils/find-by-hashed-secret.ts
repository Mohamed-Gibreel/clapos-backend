import * as bcrypt from 'bcrypt';

// Finds which candidate's hashed secret (e.g. a bcrypt-hashed PIN) matches a
// plaintext value. Hashed secrets can't be looked up by an equality query
// (the salt makes every hash of the same plaintext different), so this has
// to compare against each candidate in turn.
export async function findByHashedSecret<T>(
  candidates: T[],
  secret: string,
  getHash: (candidate: T) => string,
): Promise<T | undefined> {
  for (const candidate of candidates) {
    if (await bcrypt.compare(secret, getHash(candidate))) {
      return candidate;
    }
  }
  return undefined;
}
