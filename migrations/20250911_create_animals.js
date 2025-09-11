/* eslint-disable camelcase */
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
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('animals');
};
