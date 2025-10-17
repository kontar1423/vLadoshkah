import { query } from '../db.js'; // ✅ ДОБАВЛЕНО
import { debug, info, error } from '../logger.js'; // ✅ ДОБАВЛЕНО

async function create(photoData) {
  try {
    const { 
      original_name, 
      object_name, 
      bucket = 'uploads', 
      size, 
      mimetype, 
      entity_id, 
      entity_type,
      url
    } = photoData;
    
    const result = await query(
      `INSERT INTO photos 
       (original_name, object_name, bucket, size, mimetype, entity_id, entity_type, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [original_name, object_name, bucket, size, mimetype, entity_id, entity_type, url]
    );
    
    info({ photo: result.rows[0] }, 'DAO: created photo');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating photo');
    throw err;
  }
}

async function getAll() {
  try {
    const result = await query('SELECT * FROM photos ORDER BY uploaded_at DESC');
    debug({ count: result.rowCount }, 'DAO: fetched all photos');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all photos');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await query('SELECT * FROM photos WHERE id = $1', [id]);
    debug({ id, found: !!result.rows[0] }, 'DAO: fetched photo by id');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching photo by id');
    throw err;
  }
}

async function getByObjectName(objectName) {
  try {
    const result = await query('SELECT * FROM photos WHERE object_name = $1', [objectName]);
    debug({ objectName, found: !!result.rows[0] }, 'DAO: fetched photo by object name');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching photo by object name');
    throw err;
  }
}

async function getByEntity(entityType, entityId) {
  try {
    const result = await query(
      'SELECT * FROM photos WHERE entity_type = $1 AND entity_id = $2 ORDER BY uploaded_at DESC',
      [entityType, entityId]
    );
    debug({ entityType, entityId, count: result.rowCount }, 'DAO: fetched photos by entity');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching photos by entity');
    throw err;
  }
}

async function getByEntityType(entityType) {
  try {
    const result = await query(
      'SELECT * FROM photos WHERE entity_type = $1 ORDER BY uploaded_at DESC',
      [entityType]
    );
    debug({ entityType, count: result.rowCount }, 'DAO: fetched photos by entity type');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching photos by entity type');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await query('DELETE FROM photos WHERE id = $1 RETURNING *', [id]);
    info({ id, deleted: result.rowCount }, 'DAO: deleted photo');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error deleting photo');
    throw err;
  }
}

export default {
  getAll,
  getById,
  getByObjectName,
  getByEntity,
  getByEntityType,
  create,
  remove
};