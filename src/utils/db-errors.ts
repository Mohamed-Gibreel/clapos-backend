/**
 * Postgres error codes we branch on. See
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const UNIQUE_VIOLATION = '23505';

/**
 * True when the error is a Postgres unique-constraint violation.
 *
 * TypeORM surfaces the driver error as `QueryFailedError`, which copies the
 * driver's properties onto itself — but only when the query goes through the
 * regular query path, so fall back to `driverError` for the cases where it
 * doesn't.
 */
export const isUniqueViolation = (error: any): boolean =>
  error?.code === UNIQUE_VIOLATION ||
  error?.driverError?.code === UNIQUE_VIOLATION;
