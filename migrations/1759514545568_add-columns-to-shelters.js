/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.addColumn('shelters', {
        photo: {type: 'varchar(100)'},
        adress: {type: 'varchar(200)'},
        credits: {type: 'int'},
        reports: {type: 'varchar(20)'}
    })
    pgm.sql(`UPDATE shelters SET adress = 'не указан' WHERE adress IS NULL`);
    pgm.sql(`UPDATE shelters SET reports = 'не указано' WHERE reports IS NULL`);

    pgm.alterColumn('shelters', 'adress', { notNull: true });
    pgm.alterColumn('shelters', 'reports', { notNull: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
     pgm.dropColumn('shelters', ['photo', 'adress', 'credits', 'reports'])
};
