const pool = require('../db');
const logger = require('../logger');

async function getAll() {
  try {
    const result = await pool.query('SELECT * FROM users');
    logger.debug({ count: result.rowCount }, 'DAO: fetched all users');
    return result.rows;
  } catch (err) {
    logger.error(err, 'DAO: error fetching all users');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    logger.debug({ id, count: result.rowCount }, 'DAO: fetched user by id');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error fetching user by id');
    throw err;
  }
}

async function create({ firstname, lastname, photo, role, gender, email }) {
  try {
    const result = await pool.query(
      'INSERT INTO users(firstname, lastname, photo, role, gender, email) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [firstname, lastname, photo, role, gender, email]
    );
    logger.info({ user: result.rows[0] }, 'DAO: created user');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error creating user');
    throw err;
  }
}

async function update(id, { firstname, lastname, photo, role, gender, email }) {
  try {
    const result = await pool.query(
      'UPDATE users SET firstname=$1, lastname=$2, photo=$3, role=$4, gender=$5, email=$6 WHERE id=$7 RETURNING *',
      [firstname, lastname, photo, role, gender, email, id]
    );
    logger.info({ id, updated: result.rowCount }, 'DAO: updated user');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error updating user');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING *', [id]);
    logger.info({ id, deleted: result.rowCount }, 'DAO: deleted user');
    return result.rows[0];
  } catch (err) {
    logger.error(err, 'DAO: error deleting user');
    throw err;
  }
}

module.exports = { getAll, getById, create, update, remove };
