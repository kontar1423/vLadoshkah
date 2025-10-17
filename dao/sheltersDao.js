import { query } from '../db.js'; // ← ЭТОЙ СТРОКИ НЕТ В ВАШЕМ ФАЙЛЕ!
import { debug, info, error } from '../logger.js';

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
  const { name, address = null, credits = null, reports = null } = data;

  try {
    const result = await query(
      `INSERT INTO shelters(name, address, credits, reports)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [name, address, credits, reports]
    );
    info({ shelter: result.rows[0] }, 'DAO: created shelter');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating shelter');
    throw err;
  }
}

async function update(id, name, address, credids, reports) {
  try {
    const result = await query(
      'UPDATE shelters SET name=$1, address=$2, credits=$3, reports=$4 WHERE id=$5 RETURNING *',
      [name, address, credids, reports, id]
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
