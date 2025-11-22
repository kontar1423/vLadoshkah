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
  pgm.createTable('applications', {
    id: { 
      type: 'serial', 
      primaryKey: true 
    },
    user_id: { 
      type: 'integer', 
      notNull: true 
    },
    shelter_id: { 
      type: 'integer', 
      notNull: true 
    },
    animal_id: { 
      type: 'integer', 
      notNull: true 
    },
    status: { 
      type: 'varchar(50)', 
      notNull: true,
      default: 'pending'
    },
    description: { 
      type: 'text', 
      notNull: true 
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp', 
      default: pgm.func('current_timestamp')
    }
  });
  pgm.createIndex('applications', 'user_id');
  pgm.createIndex('applications', 'shelter_id');
  pgm.createIndex('applications', 'animal_id');
  pgm.createIndex('applications', 'status');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('applications');
};