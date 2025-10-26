import { query } from '../db.js';
import { debug, info, error } from '../logger.js';

async function create(applicationData) {
    const { user_id, shelter_id, animal_id, is_active, description } = applicationData;
    try {
    const result = await query(
        `INSERT INTO applications (user_id, shelter_id, animal_id, is_active, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, shelter_id, animal_id, is_active, description]
    );
    info({ application: result.rows[0] }, 'DAO: created application');
    return result.rows[0];
    } catch (err) {
        error(err, 'DAO: error creating application');
        throw err;
    }
}

async function getById(id) {
    try {
    const result = await query(
        `SELECT * FROM applications WHERE id = $1`,
        [id]
    );
    info({ application: result.rows[0] }, 'DAO: fetched application by id');
    return result.rows[0] || null;
    } catch (err) {
        error(err, 'DAO: error fetching application by id');
        throw err;
    }
}

async function getAll() {
    try {
    const result = await query(
        `SELECT * FROM applications`,
    );
    info({ applications: result.rows }, 'DAO: fetched all applications');
    return result.rows;
    } catch (err) {
        error(err, 'DAO: error fetching all applications');
        throw err;
    }
}

async function update(id, applicationData) {
    const { user_id, shelter_id, animal_id, is_active, description = null } = applicationData;
    try {
    const result = await query(
        `UPDATE applications SET user_id = $1, shelter_id = $2, animal_id = $3, is_active = $4, description = $5 WHERE id = $6 RETURNING *`,
        [user_id, shelter_id, animal_id, is_active, description, id]
    );
    info({ application: result.rows[0] }, 'DAO: updated application');
    return result.rows[0] || null;
    } catch (err) {
        error(err, 'DAO: error updating application');
        throw err;
    }
}

async function remove(id) {
    try {
    const result = await query(
        `DELETE FROM applications WHERE id = $1 RETURNING *`,
        [id]
    );
    info({ application: result.rows[0] }, 'DAO: removed application');
    return result.rows[0] || null;
    } catch (err) {
        error(err, 'DAO: error removing application');
        throw err;
    }
}

export default { create, getById, getAll, update, remove };