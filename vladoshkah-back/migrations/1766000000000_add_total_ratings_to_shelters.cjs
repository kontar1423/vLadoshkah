/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.addColumn('shelters', {
    total_ratings: {
      type: 'integer',
      notNull: true,
      default: 0
    }
  });

  pgm.sql(`
    UPDATE shelters s
    SET total_ratings = v.vote_count
    FROM (
      SELECT shelter_id, COUNT(*) AS vote_count
      FROM votes
      GROUP BY shelter_id
    ) v
    WHERE s.id = v.shelter_id
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropColumn('shelters', 'total_ratings');
};
