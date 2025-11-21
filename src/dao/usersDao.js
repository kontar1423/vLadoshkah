import { query } from '../db.js';
import { debug, info, error } from '../logger.js';
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

async function getByEmail(email) {
  try {
    const result = await query('SELECT * FROM users WHERE email=$1', [email]);
    debug({ email, count: result.rowCount }, 'DAO: fetched user by email');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching user by email');
    throw err;
  }
}

async function create({firstname, lastname, role, gender, email, phone, password}) {
  try {
    const result = await query(
      `INSERT INTO users(
        firstname, lastname, role, gender, email, phone, password, created_at, updated_at
      ) VALUES($1,$2,$3,$4,$5,$6,$7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [firstname, lastname, role, gender, email, phone, password]
    );
    info({ user: result.rows[0] }, 'DAO: created user');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating user');
    throw err;
  }
}

async function update(id, { firstname, lastname, role, gender, email, phone, password}) {
  try {
    const currentUser = await getById(id);
    if (!currentUser) {
      return null;
    }
    const updatedData = {
      firstname: firstname !== undefined ? firstname : currentUser.firstname,
      lastname: lastname !== undefined ? lastname : currentUser.lastname,
      role: role !== undefined ? role : currentUser.role,
      gender: gender !== undefined ? gender : currentUser.gender,
      email: email !== undefined ? email : currentUser.email,
      phone: phone !== undefined ? phone : currentUser.phone,
      password: password !== undefined ? password : currentUser.password,
    };
    const result = await query(
      'UPDATE users SET firstname=$1, lastname=$2, role=$3, gender=$4, email=$5, phone=$6, password=$7, updated_at = CURRENT_TIMESTAMP WHERE id=$8 RETURNING *',
      [updatedData.firstname, updatedData.lastname, updatedData.role, updatedData.gender, updatedData.email, updatedData.phone, updatedData.password, id]
    );
    info({ user: result.rows[0] }, 'DAO: updated user');
    return result.rows[0] || null;
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

export default { getAll, getById, getByEmail, create, update, remove };
