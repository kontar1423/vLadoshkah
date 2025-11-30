import { query } from '../db.js';
import { info, error } from '../logger.js';

async function create(applicationData) {
  const { user_id, shelter_id, animal_id, status, description, type = 'take' } = applicationData;
  try {
    const result = await query(
      `INSERT INTO applications (user_id, shelter_id, animal_id, status, description, type) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, shelter_id ?? null, animal_id ?? null, status, description, type]
    );
    info({ application: result.rows[0] }, 'DAO: created application');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating application');
    throw err;
  }
}

async function getById(id, type = null) {
  try {
    const params = [id];
    let queryText = `SELECT * FROM applications WHERE id = $1`;

    if (type) {
      params.push(type);
      queryText += ` AND type = $2`;
    }

    const result = await query(queryText, params);
    info({ application: result.rows[0] }, 'DAO: fetched application by id');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error fetching application by id');
    throw err;
  }
}

async function getAll(options = {}) {
  try {
    const params = [];
    let whereClause = '';

    if (options.type) {
      params.push(options.type);
      whereClause = `WHERE type = $1`;
    }

    const result = await query(
      `SELECT * FROM applications ${whereClause} ORDER BY created_at DESC`,
      params
    );
    info({ count: result.rowCount }, 'DAO: fetched all applications');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all applications');
    throw err;
  }
}

async function update(id, applicationData, type = null) {
  try {
    // Сначала получаем текущие данные заявки
    const currentApp = await getById(id, type);
    if (!currentApp) {
      return null;
    }

    // Объединяем текущие данные с новыми
    const updatedData = {
      user_id: applicationData.user_id !== undefined ? applicationData.user_id : currentApp.user_id,
      shelter_id: applicationData.shelter_id !== undefined ? applicationData.shelter_id : currentApp.shelter_id,
      animal_id: applicationData.animal_id !== undefined ? applicationData.animal_id : currentApp.animal_id,
      status: applicationData.status !== undefined ? applicationData.status : currentApp.status,
      description: applicationData.description !== undefined ? applicationData.description : currentApp.description,
      type: applicationData.type !== undefined ? applicationData.type : currentApp.type
    };

    const result = await query(
      `UPDATE applications 
         SET user_id = $1, 
             shelter_id = $2, 
             animal_id = $3, 
             status = $4, 
             description = $5, 
             type = $6,
             updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [
        updatedData.user_id,
        updatedData.shelter_id,
        updatedData.animal_id,
        updatedData.status,
        updatedData.description,
        updatedData.type,
        id
      ]
    );
    info({ application: result.rows[0] }, 'DAO: updated application');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error updating application');
    throw err;
  }
}

async function remove(id, type = null) {
  try {
    const params = [id];
    let queryText = `DELETE FROM applications WHERE id = $1`;

    if (type) {
      params.push(type);
      queryText += ` AND type = $2`;
    }

    queryText += ` RETURNING *`;

    const result = await query(queryText, params);
    info({ application: result.rows[0] }, 'DAO: removed application');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error removing application');
    throw err;
  }
}

async function countByStatus(status, type = null) {
  try {
    const params = [status];
    let whereClause = `WHERE status = $1`;

    if (type) {
      params.push(type);
      whereClause += ` AND type = $2`;
    }

    const result = await query(
      `SELECT COUNT(*) as count FROM applications ${whereClause}`,
      params
    );
    info({ status, type, count: result.rows[0].count }, 'DAO: counted applications by status');
    return parseInt(result.rows[0].count, 10);
  } catch (err) {
    error(err, 'DAO: error counting applications by status');
    throw err;
  }
}

async function getByAnimalId(animalId, type = null) {
  try {
    const params = [animalId];
    let whereClause = `WHERE animal_id = $1`;

    if (type) {
      params.push(type);
      whereClause += ` AND type = $2`;
    }

    const result = await query(
      `SELECT * FROM applications ${whereClause} ORDER BY created_at DESC`,
      params
    );
    info({ animalId, type, count: result.rowCount }, 'DAO: fetched applications by animal_id');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching applications by animal_id');
    throw err;
  }
}

export default { create, getById, getAll, update, remove, countByStatus, getByAnimalId };
