import { query } from '../db.js';
import { debug, info, error } from '../logger.js';

async function getAll() {
  try {
    const result = await query('SELECT * FROM shelters ORDER BY name');
    debug({ count: result.rowCount }, 'DAO: fetched all shelters');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all shelters');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await query('SELECT * FROM shelters WHERE id = $1', [id]);
    debug({ id, found: !!result.rows[0] }, 'DAO: fetched shelter by id');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching shelter by id');
    throw err;
  }
}

async function create({ name, address, phone, email, website, description, capacity, working_hours }) {
  try {
    const result = await query(
      `INSERT INTO shelters (
        name, address, phone, email, website, description, capacity, working_hours
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [name, address, phone, email, website, description, capacity, working_hours]
    );
    info({ shelter: result.rows[0] }, 'DAO: created shelter');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating shelter');
    throw err;
  }
}

async function update(id, { name, address, phone, email, website, description, capacity, working_hours, status }) {
  try {
    const result = await query(
      `UPDATE shelters SET 
        name = $1, address = $2, phone = $3, email = $4, website = $5, 
        description = $6, capacity = $7, working_hours = $8, status = $9,
        updated_at = NOW() 
      WHERE id = $10 
      RETURNING *`,
      [name, address, phone, email, website, description, capacity, working_hours, status, id]
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
    const result = await query('DELETE FROM shelters WHERE id = $1 RETURNING *', [id]);
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
  remove
};