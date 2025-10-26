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
  pgm.createTable('shelters', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    address: { type: 'varchar(500)' },
    phone: { type: 'varchar(50)' },
    email: { type: 'varchar(255)' },
    website: { type: 'varchar(255)' },
    description: { type: 'text' },
    capacity: { type: 'integer' },
    working_hours: { type: 'varchar(200)' },
    status: { 
      type: 'varchar(50)', 
      default: 'active'
    },
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
  pgm.dropTable('shelters');
};