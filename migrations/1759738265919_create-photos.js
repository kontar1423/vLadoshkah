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
    pgm.createTable('photos',{
        id: 'id',
        url: {type: 'varchar(500)', notNull:true},
        entity_id: {type: 'int', notNull:true},
        entity_type: {type: 'varchar(30)', notNull: true},
        uploaded_at: {type: 'varchar(100)', notNull:true}
    })
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.DropTable('photos')
};
