import { query } from '../db';
import { debug, error, info } from '../logger';

async function getAll() {
  try {
    const result = await query('SELECT * FROM users');
    debug({ count: result.rowCount }, 'DAO: fetched all users');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all users');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await query('SELECT * FROM users WHERE id=$1', [id]);
    debug({ id, count: result.rowCount }, 'DAO: fetched user by id');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching user by id');
    throw err;
  }
}

async function create({firstname, lastname, role, gender, email }) {
  try {
    const result = await query(
      'INSERT INTO users(firstname, lastname, role, gender, email) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [firstname, lastname, role, gender, email]
    );
    info({ user: result.rows[0] }, 'DAO: created user');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating user');
    throw err;
  }
}

async function update(id, { firstname, lastname, role, gender, email }) {
  try {
    const result = await query(
      'UPDATE users SET firstname=$1, lastname=$2, role=$3, gender=$4, email=$5 WHERE id=$6 RETURNING *',
      [firstname, lastname, role, gender, email, id]
    );
    info({ id, updated: result.rowCount }, 'DAO: updated user');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error updating user');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await query('DELETE FROM users WHERE id=$1 RETURNING *', [id]);
    info({ id, deleted: result.rowCount }, 'DAO: deleted user');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error deleting user');
    throw err;
  }
}

export default { getAll, getById, create, update, remove };
