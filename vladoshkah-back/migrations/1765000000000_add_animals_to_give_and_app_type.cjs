/* eslint-disable camelcase */
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable('animals_to_give', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    species: { type: 'varchar(100)', notNull: true },
    breed: { type: 'varchar(100)' },
    character: { type: 'varchar(255)' },
    gender: { type: 'varchar(30)' },
    birth_date: { type: 'date' },
    vaccination_status: { type: 'varchar(255)' },
    health_status: { type: 'varchar(255)' },
    special_needs: { type: 'varchar(500)' },
    history: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  pgm.addColumn('applications', {
    type: { type: 'varchar(10)', notNull: true, default: 'take' }
  });

  pgm.addConstraint('applications', 'applications_type_check', {
    check: "type IN ('take','give')"
  });

  // Для заявок на отдачу приюта не требуется
  pgm.alterColumn('applications', 'shelter_id', { notNull: false });
  pgm.alterColumn('applications', 'animal_id', { notNull: false });

  pgm.sql(`UPDATE applications SET type = 'take' WHERE type IS NULL`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropConstraint('applications', 'applications_type_check');
  pgm.dropColumn('applications', 'type');
  pgm.alterColumn('applications', 'shelter_id', { notNull: true });
  pgm.alterColumn('applications', 'animal_id', { notNull: true });
  pgm.dropTable('animals_to_give');
};
