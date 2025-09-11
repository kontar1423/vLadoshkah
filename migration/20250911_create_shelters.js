/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('shelters', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('shelters');
};
