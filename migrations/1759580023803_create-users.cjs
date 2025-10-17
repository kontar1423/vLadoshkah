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
    pgm.createTable('users', {
        id: 'id',
        firstname: { type: 'varchar(100)', notNull: true },
        lastname: { type: 'varchar(100)', notNull: true },
        role: { type: 'varchar(30)', notNull: true },
        gender: { type: 'varchar(30)', notNull: true },
        email: { type: 'varchar(100)', notNull: true },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('users');
};