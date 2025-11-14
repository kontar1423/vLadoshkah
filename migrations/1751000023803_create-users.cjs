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
        email: { type: 'varchar(100)', notNull: true, unique: true},
        password: {type: 'varchar(255)', notNull: true},
        firstname: { type: 'varchar(100)'},
        lastname: { type: 'varchar(100)'},
        role: { type: 'varchar(30)', notNull: true },
        gender: { type: 'varchar(30)'},
        phone: { type: 'varchar(30)'},
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