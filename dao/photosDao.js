import { query } from '../db'; 
import logger from '../logger';

async function getAll() {
    const result = await query('SELECT * FROM photos ORDER BY uploaded_at DESC');
    return result.rows;
}

async function getById(id) {
    const result = await query('SELECT * FROM photos WHERE id = $1', [id]);
    return result.rows[0];
}

async function getByEntity(entityType, entityId) {
    const result = await query(
        'SELECT * FROM photos WHERE entity_type = $1 AND entity_id = $2 ORDER BY uploaded_at DESC',
        [entityType, entityId]
    );
    return result.rows;
}
async function getByEntityType(entityType) {
    const result = await query(
        'SELECT * FROM photos WHERE entity_type = $1 ORDER BY uploaded_at DESC',
        [entityType]
    );
    return result.rows;
}

async function create(photo) {
    const { url, entity_id, entity_type } = photo;
    const result = await query(
        `INSERT INTO photos (url, entity_id, entity_type, uploaded_at)
            VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [url, entity_id, entity_type]
    );
    return result.rows[0];
}

async function remove(id) {
    const result = await query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
}

export default {
    getAll,
    getById,
    getByEntity,
    create,
    remove,
    getByEntityType
}