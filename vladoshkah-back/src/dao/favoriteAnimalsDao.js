import { query } from '../db.js';
import { debug, info, error } from '../logger.js';

async function find(userId, animalId) {
  try {
    const result = await query(
      `SELECT * FROM favorite_animals WHERE user_id = $1 AND animal_id = $2`,
      [userId, animalId]
    );
    debug({ userId, animalId, found: result.rowCount > 0 }, 'DAO: fetched favorite');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error fetching favorite');
    throw err;
  }
}

async function create({ user_id, animal_id }) {
  try {
    const result = await query(
      `INSERT INTO favorite_animals (user_id, animal_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, animal_id) DO NOTHING
       RETURNING *`,
      [user_id, animal_id]
    );
    info({ user_id, animal_id, created: result.rowCount > 0 }, 'DAO: created favorite');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error creating favorite');
    throw err;
  }
}

async function remove(userId, animalId) {
  try {
    const result = await query(
      `DELETE FROM favorite_animals WHERE user_id = $1 AND animal_id = $2 RETURNING *`,
      [userId, animalId]
    );
    info({ userId, animalId, removed: result.rowCount > 0 }, 'DAO: deleted favorite');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error deleting favorite');
    throw err;
  }
}

async function getAllByUser(userId) {
  try {
    const result = await query(
      `SELECT * FROM favorite_animals WHERE user_id = $1`,
      [userId]
    );
    debug({ userId, count: result.rowCount }, 'DAO: fetched favorites by user');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching favorites by user');
    throw err;
  }
}

async function getByUserAndAnimalIds(userId, animalIds = []) {
  if (!animalIds.length) {
    return [];
  }

  try {
    const result = await query(
      `SELECT animal_id FROM favorite_animals WHERE user_id = $1 AND animal_id = ANY($2::int[])`,
      [userId, animalIds]
    );
    debug({ userId, count: result.rowCount }, 'DAO: fetched favorites by user and animal ids');
    return result.rows.map((row) => row.animal_id);
  } catch (err) {
    error(err, 'DAO: error fetching favorites by ids');
    throw err;
  }
}

export default {
  find,
  create,
  remove,
  getAllByUser,
  getByUserAndAnimalIds
};
