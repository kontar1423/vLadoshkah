import { query } from '../db.js';
import { debug, info, error } from '../logger.js';

async function create(data) {
  const {
    name,
    species,
    breed = null,
    character = null,
    gender = null,
    birth_date = null,
    vaccination_status = null,
    health_status = null,
    special_needs = null,
    history = null
  } = data;

  try {
    const result = await query(
      `INSERT INTO animals_to_give
        (name, species, breed, character, gender, birth_date, vaccination_status, health_status, special_needs, history)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [name, species, breed, character, gender, birth_date, vaccination_status, health_status, special_needs, history]
    );
    info({ animalToGive: result.rows[0] }, 'DAO: created animal_to_give');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating animal_to_give');
    throw err;
  }
}

async function getAll() {
  try {
    const result = await query('SELECT * FROM animals_to_give ORDER BY created_at DESC');
    debug({ count: result.rowCount }, 'DAO: fetched all animals_to_give');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching animals_to_give');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await query('SELECT * FROM animals_to_give WHERE id = $1', [id]);
    debug({ id, found: !!result.rows[0] }, 'DAO: fetched animal_to_give by id');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error fetching animal_to_give by id');
    throw err;
  }
}

async function getByIds(ids = []) {
  if (!ids.length) return [];
  try {
    const result = await query(
      `SELECT * FROM animals_to_give WHERE id = ANY($1::int[])`,
      [ids]
    );
    debug({ count: result.rowCount }, 'DAO: fetched animals_to_give by ids');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching animals_to_give by ids');
    throw err;
  }
}

async function update(id, data) {
  try {
    const current = await getById(id);
    if (!current) {
      return null;
    }

    const merged = {
      name: data.name !== undefined ? data.name : current.name,
      species: data.species !== undefined ? data.species : current.species,
      breed: data.breed !== undefined ? data.breed : current.breed,
      character: data.character !== undefined ? data.character : current.character,
      gender: data.gender !== undefined ? data.gender : current.gender,
      birth_date: data.birth_date !== undefined ? data.birth_date : current.birth_date,
      vaccination_status: data.vaccination_status !== undefined ? data.vaccination_status : current.vaccination_status,
      health_status: data.health_status !== undefined ? data.health_status : current.health_status,
      special_needs: data.special_needs !== undefined ? data.special_needs : current.special_needs,
      history: data.history !== undefined ? data.history : current.history,
    };

    const result = await query(
      `UPDATE animals_to_give
       SET name = $1,
           species = $2,
           breed = $3,
           character = $4,
           gender = $5,
           birth_date = $6,
           vaccination_status = $7,
           health_status = $8,
           special_needs = $9,
           history = $10,
           updated_at = current_timestamp
       WHERE id = $11
       RETURNING *`,
      [
        merged.name,
        merged.species,
        merged.breed,
        merged.character,
        merged.gender,
        merged.birth_date,
        merged.vaccination_status,
        merged.health_status,
        merged.special_needs,
        merged.history,
        id
      ]
    );

    info({ animalToGive: result.rows[0] }, 'DAO: updated animal_to_give');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error updating animal_to_give');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await query(
      'DELETE FROM animals_to_give WHERE id = $1 RETURNING *',
      [id]
    );
    info({ id, removed: result.rowCount }, 'DAO: removed animal_to_give');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error removing animal_to_give');
    throw err;
  }
}

export default {
  create,
  getAll,
  getById,
  getByIds,
  update,
  remove
};
