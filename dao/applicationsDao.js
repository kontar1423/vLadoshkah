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
    
    try {
            // Сначала получаем текущие данные заявки
            const currentApp = await getById(id);
            if (!currentApp) {
                return null;
            }
    
            // Объединяем текущие данные с новыми
            const updatedData = {
                user_id: applicationData.user_id !== undefined ? applicationData.user_id : currentApp.user_id,
                shelter_id: applicationData.shelter_id !== undefined ? applicationData.shelter_id : currentApp.shelter_id,
                animal_id: applicationData.animal_id !== undefined ? applicationData.animal_id : currentApp.animal_id,
                is_active: applicationData.is_active !== undefined ? applicationData.is_active : currentApp.is_active,
                description: applicationData.description !== undefined ? applicationData.description : currentApp.description
            };
    
            const result = await query(
                `UPDATE applications SET user_id = $1, shelter_id = $2, animal_id = $3, is_active = $4, description = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
                [updatedData.user_id, updatedData.shelter_id, updatedData.animal_id, updatedData.is_active, updatedData.description, id]
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