import { query } from '../db';
import { debug, error, info } from '../logger';

async function getAll() {
  try {
    const result = await query('SELECT * FROM shelters ORDER BY id');
    debug({ count: result.rowCount }, 'DAO: fetched all shelters');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all shelters');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await query('SELECT * FROM shelters WHERE id=$1', [id]);
    debug({ id, count: result.rowCount }, 'DAO: fetched shelter by id');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching shelter');
    throw err;
  }
}

async function create(data) {
  const { name, photo = null, adress = null, credits = null, reports = null } = data;

  try {
    const result = await query(
      `INSERT INTO shelters(name, adress, credits, reports)
       VALUES($1, $3, $4, $5)
       RETURNING *`,
      [name, adress, credits, reports]
    );
    info({ shelter: result.rows[0] }, 'DAO: created shelter');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating shelter');
    throw err;
  }
}

async function update(id, name, adress, credids, reports) {
  try {
    const result = await query(
      'UPDATE shelters SET name=$1, adress=$2, credits=$3, reports=$4 WHERE id=$5 RETURNING *',
      [name, adress, credids, reports, id]
    );
    info({ id, updated: result.rowCount }, 'DAO: updated shelter');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error updating shelter');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await query(
      'DELETE FROM shelters WHERE id=$1 RETURNING *',
      [id]
    );
    info({ id, deleted: result.rowCount }, 'DAO: deleted shelter');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error deleting shelter');
    throw err;
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
