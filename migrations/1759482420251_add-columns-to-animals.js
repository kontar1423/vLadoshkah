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
// 1️⃣ Добавляем все колонки, все nullable
  pgm.addColumns('animals', {
    health: { type: 'varchar(30)' },
    gender: { type: 'varchar(10)' },
    color: { type: 'varchar(50)' },
    weight: { type: 'int' },
    photo: { type: 'varchar(300)' },
    personality: { type: 'varchar(100)' },
    size: { type: 'int' },
    history: { type: 'varchar(1000)' },
  });

  // 2️⃣ Заполняем дефолтные значения для обязательных полей
    pgm.sql(`
    UPDATE animals
    SET health = 'не указан',
        gender = 'не указан',
        color = 'не указан',
        weight = 0,
        photo = '',
        size = 0
    WHERE health IS NULL OR sex IS NULL OR color IS NULL OR weight IS NULL OR photo IS NULL OR size IS NULL;
  `);

  // 3️⃣ Делаем колонки обязательными
  pgm.alterColumn('animals', 'health', { notNull: true });
  pgm.alterColumn('animals', 'gender', { notNull: true });
  pgm.alterColumn('animals', 'color', { notNull: true });
  pgm.alterColumn('animals', 'weight', { notNull: true });
  pgm.alterColumn('animals', 'photo', { notNull: true });
  pgm.alterColumn('animals', 'size', { notNull: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropColumn('animals', ["health", "gender", "color", "weight", "personality", "size", "history"]);
};
