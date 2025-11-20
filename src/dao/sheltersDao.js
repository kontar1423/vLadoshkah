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

async function getByAdminId(adminId) {
  try {
    const result = await query('SELECT * FROM shelters WHERE admin_id = $1', [adminId]);
    debug({ adminId, count: result.rowCount }, 'DAO: fetched shelters by admin_id');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching shelters by admin_id');
    throw err;
  }
}

async function create({ name, address, phone, email, website, description, capacity, working_hours, can_adopt, admin_id, region }) {
  try {
    const result = await query(
      `INSERT INTO shelters (
        name, address, phone, email, website, description, capacity, working_hours, can_adopt, admin_id, region
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [name, address, phone, email, website, description, capacity, working_hours, can_adopt !== undefined ? can_adopt : null, admin_id || null, region || null]
    );
    info({ shelter: result.rows[0] }, 'DAO: created shelter');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating shelter');
    throw err;
  }
}

async function update(id, { name, address, phone, email, website, description, capacity, working_hours, can_adopt, admin_id, status, region}) {
  try {
    const currentShelter = await getById(id);
    if (!currentShelter) {
      return null;
    }
    const updatedData = {
      name: name !== undefined ? name : currentShelter.name,
      address: address !== undefined ? address : currentShelter.address,
      phone: phone !== undefined ? phone : currentShelter.phone,
      email: email !== undefined ? email : currentShelter.email,
      website: website !== undefined ? website : currentShelter.website,
      description: description !== undefined ? description : currentShelter.description,
      capacity: capacity !== undefined ? capacity : currentShelter.capacity,
      working_hours: working_hours !== undefined ? working_hours : currentShelter.working_hours,
      can_adopt: can_adopt !== undefined ? can_adopt : currentShelter.can_adopt,
      admin_id: admin_id !== undefined ? admin_id : currentShelter.admin_id,
      status: status !== undefined ? status : currentShelter.status,
      region: region !== undefined ? region : currentShelter.region,
    };
    const result = await query(
      `UPDATE shelters SET name = $1, address = $2, phone = $3, email = $4, website = $5, description = $6, capacity = $7, working_hours = $8, can_adopt = $9, admin_id = $10, status = $11, region = $12, updated_at = CURRENT_TIMESTAMP WHERE id = $13 RETURNING *`,
      [updatedData.name, updatedData.address, updatedData.phone, updatedData.email, updatedData.website, updatedData.description, updatedData.capacity, updatedData.working_hours, updatedData.can_adopt, updatedData.admin_id, updatedData.status, updatedData.region, id]
    );
    info({ shelter: result.rows[0] }, 'DAO: updated shelter');
    return result.rows[0] || null;
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

async function updateRating(id, rating) {
  try {
    const result = await query(
      `UPDATE shelters 
       SET rating = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [rating, id]
    );
    info({ id, rating }, 'DAO: updated shelter rating');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error updating shelter rating');
    throw err;
  }
}

export default { 
  getAll, 
  getById, 
  getByAdminId,
  create, 
  update, 
  remove,
  updateRating
};
