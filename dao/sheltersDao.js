const pool = require('../db');
const logger = require('../logger');

async function getAll() {
  try {
    const result = await pool.query('SELECT * FROM shelters ORDER BY id');
    logger.debug({ count: result.rowCount }, 'DAO: fetched all shelters');
    return result.rows;
  } catch (err) {
    logger.error(err, 'DAO: error fetching all shelters');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await pool.query('SELECT * FROM shelters WHERE id=$1', [id]);
    logger.debug({ id, count: result.rowCount }, 'DAO: fetched shelter by id');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error fetching shelter');
    throw err;
  }
}

async function create(data) {
  const { name, photo = null, adress = null, credits = null, reports = null } = data;

  try {
    const result = await pool.query(
      `INSERT INTO shelters(name, photo, adress, credits, reports)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, photo, adress, credits, reports]
    );
    logger.info({ shelter: result.rows[0] }, 'DAO: created shelter');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error creating shelter');
    throw err;
  }
}

async function update(id, name) {
  try {
    const result = await pool.query(
      'UPDATE shelters SET name=$1 WHERE id=$2 RETURNING *',
      [name, id]
    );
    logger.info({ id, updated: result.rowCount }, 'DAO: updated shelter');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error updating shelter');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await pool.query(
      'DELETE FROM shelters WHERE id=$1 RETURNING *',
      [id]
    );
    logger.info({ id, deleted: result.rowCount }, 'DAO: deleted shelter');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error deleting shelter');
    throw err;
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
