  /* eslint-disable camelcase */
  /**
   * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
   */
  exports.shorthands = undefined;

  /**
   * @param pgm {import('node-pg-migrate').MigrationBuilder}
   * @param run {() => void | undefined}
   * @returns {Promise<void> | void}
   */
exports.up = (pgm) => {
  pgm.createTable('animals', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    age: { type: 'int', notNull: true },
    type: { type: 'varchar(50)', notNull: true },
    shelter_id: {
      type: 'int',
      notNull: true,
      references: 'shelters',
      onDelete: 'cascade'
    },
    health: { type: 'varchar(30)' },
    gender: { type: 'varchar(10)' },
    color: { type: 'varchar(50)' },
    weight: { type: 'float(2)' },
    personality: { type: 'varchar(100)' },
    animal_size: { type: 'varchar(40)' },
    history: { type: 'varchar(1000)' },
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
};
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('animals');
};
