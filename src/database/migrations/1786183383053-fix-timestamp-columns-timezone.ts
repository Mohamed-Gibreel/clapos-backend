import { MigrationInterface, QueryRunner } from 'typeorm';

// `timestamp without time zone` columns store a bare wall-clock literal
// with no zone info. TypeORM's Postgres driver formats/parses that literal
// inconsistently across the write and read paths when the app server's
// system timezone isn't UTC, silently shifting the value by the server's
// UTC offset. This broke `GET /sync/catalog`'s `updatedAt > since`
// incremental-sync cursor: a product edited well within a few hours of the
// last sync would already look "older" than the cursor and be dropped from
// the response.
//
// Switches every base-entity timestamp (createdAt/updatedAt/deletedAt) plus
// the handful of other Date columns to `timestamptz`, which Postgres always
// stores as an absolute UTC instant regardless of session timezone.
//
// `ALTER COLUMN ... TYPE timestamptz` (no USING clause) casts the existing
// value using the session's current timezone — this database's session
// timezone is `Etc/UTC` (see `SHOW TIMEZONE`), so this is a lossless,
// data-preserving change: no existing timestamps are altered, only the
// column's type/semantics going forward.
const COLUMNS: Array<[table: string, column: string]> = [
  ['tenant', 'createdAt'],
  ['tenant', 'updatedAt'],
  ['tenant', 'deletedAt'],
  ['user', 'last_login_at'],
  ['pos_terminal', 'createdAt'],
  ['pos_terminal', 'updatedAt'],
  ['pos_terminal', 'deletedAt'],
  ['pos_terminal', 'lastSeenAt'],
  ['tax_config', 'createdAt'],
  ['tax_config', 'updatedAt'],
  ['tax_config', 'deletedAt'],
  ['table', 'createdAt'],
  ['table', 'updatedAt'],
  ['table', 'deletedAt'],
  ['folder', 'createdAt'],
  ['folder', 'updatedAt'],
  ['folder', 'deletedAt'],
  ['media', 'createdAt'],
  ['media', 'updatedAt'],
  ['media', 'deletedAt'],
  ['category', 'createdAt'],
  ['category', 'updatedAt'],
  ['category', 'deletedAt'],
  ['product', 'createdAt'],
  ['product', 'updatedAt'],
  ['product', 'deletedAt'],
  ['variation_group', 'createdAt'],
  ['variation_group', 'updatedAt'],
  ['variation_group', 'deletedAt'],
  ['variation_option', 'createdAt'],
  ['variation_option', 'updatedAt'],
  ['variation_option', 'deletedAt'],
  ['customer', 'createdAt'],
  ['customer', 'updatedAt'],
  ['customer', 'deletedAt'],
  ['customer', 'syncedAt'],
  ['order_item_variation', 'createdAt'],
  ['order_item_variation', 'updatedAt'],
  ['order_item_variation', 'deletedAt'],
  ['order_item', 'createdAt'],
  ['order_item', 'updatedAt'],
  ['order_item', 'deletedAt'],
  ['order', 'createdAt'],
  ['order', 'updatedAt'],
  ['order', 'deletedAt'],
  ['order', 'clientCreatedAt'],
  ['feature_flag', 'createdAt'],
  ['feature_flag', 'updatedAt'],
  ['feature_flag', 'deletedAt'],
  ['event', 'createdAt'],
  ['event', 'updatedAt'],
  ['event', 'deletedAt'],
  ['terminal_event', 'createdAt'],
  ['terminal_event', 'updatedAt'],
  ['terminal_event', 'deletedAt'],
  ['terminal_event', 'assignedAt'],
  ['discount', 'createdAt'],
  ['discount', 'updatedAt'],
  ['discount', 'deletedAt'],
  ['discount', 'expiresAt'],
  ['membership', 'createdAt'],
  ['membership', 'updatedAt'],
  ['membership', 'deletedAt'],
];

export class FixTimestampColumnsTimezone1786183383053
  implements MigrationInterface
{
  name = 'FixTimestampColumnsTimezone1786183383053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamptz`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamp`,
      );
    }
  }
}
