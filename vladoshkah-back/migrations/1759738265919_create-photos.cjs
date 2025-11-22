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
    pgm.createTable('photos',{
        id: 'id',
        // Основные поля для MinIO
        original_name: { type: 'varchar(255)', notNull: true },
        object_name: { type: 'varchar(500)', notNull: true },
        bucket: { type: 'varchar(255)', notNull: true, default: 'uploads' },
        size: { type: 'integer', notNull: true },
        mimetype: { type: 'varchar(100)', notNull: true },
        
        // URL для доступа к фото - ОБЯЗАТЕЛЬНОЕ поле
        url: { type: 'varchar(500)', notNull: true },
        
        // Связь с сущностями
        entity_id: { type: 'integer', notNull: true},
        entity_type: { type: 'varchar(30)', notNull: true },
        
        // Временные метки
        uploaded_at: { 
            type: 'timestamp', 
            notNull: true, 
            default: pgm.func('current_timestamp') 
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

    // Индексы
    pgm.createIndex('photos', ['entity_type', 'entity_id']);
    pgm.createIndex('photos', 'object_name');
    pgm.createIndex('photos', 'uploaded_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('photos');
};