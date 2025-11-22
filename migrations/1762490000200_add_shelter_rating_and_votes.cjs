/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Добавляем рейтинг в таблицу приютов
  pgm.addColumn('shelters', {
    rating: {
      type: 'numeric(3,2)',
      notNull: true,
      default: 0
    }
  });

  // Таблица голосов за приюты
  pgm.createTable('votes', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade'
    },
    shelter_id: {
      type: 'integer',
      notNull: true,
      references: '"shelters"',
      onDelete: 'cascade'
    },
    vote: {
      type: 'integer',
      notNull: true
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

  // Один голос пользователя за конкретный приют
  pgm.addConstraint('votes', 'votes_user_shelter_unique', {
    unique: ['user_id', 'shelter_id']
  });

  // Проверяем допустимость значения голоса
  pgm.addConstraint('votes', 'votes_vote_range', {
    check: 'vote >= 1 AND vote <= 5'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropConstraint('votes', 'votes_vote_range');
  pgm.dropConstraint('votes', 'votes_user_shelter_unique');
  pgm.dropTable('votes');
  pgm.dropColumn('shelters', 'rating');
};
