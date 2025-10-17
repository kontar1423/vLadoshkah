/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('shelters', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    address: {type: 'varchar(200)'},
    credits: {type: 'int'},
    reports: {type: 'varchar(20)'}
  });
};

exports.down = (pgm) => {
  pgm.dropTable('shelters');
};
