import pool from '../db.js';

export const PhotosDao = {
    async getAll() {
        const result = await pool.query('SELECT * FROM photos ORDER BY uploaded_at DESC');
        return result.rows;
    },

    async getById(id) {
        const result = await pool.query('SELECT * FROM photos WHERE id = $1', [id]);
        return result.rows[0];
    },

    async getByEntity(entityType, entityId) {
        const result = await pool.query(
            'SELECT * FROM photos WHERE entity_type = $1 AND entity_id = $2 ORDER BY uploaded_at DESC',
            [entityType, entityId]
        );
        return result.rows;
    },

    async create(photo) {
        const { url, entity_id, entity_type } = photo;
        const result = await pool.query(
            `INSERT INTO photos (url, entity_id, entity_type, uploaded_at)
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [url, entity_id, entity_type]
        );
        return result.rows[0];
    },

    async delete(id) {
        const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },
};
