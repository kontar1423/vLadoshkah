import { query } from '../db';
import { debug, error, info } from '../logger';

async function getAll() {
  try {
    const result = await query('SELECT * FROM animals');
    debug({ count: result.rowCount }, 'DAO: fetched all animals');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all animals');
    throw err;
  }
}

async function getAnimalsByShelter(id) {
  try{
    const result = await query('SELECT * FROM animals WHERE shelter_id=$1', [id]);
    debug({ id, count: result.rowCount }, 'DAO: fetched animals by shelterId');
    return result.rows;
  } catch (err){
    error(err, 'DAO: error fetching animals by shelterId');
    throw err;
  }
  
}
async function getById(id) {
  try {
    const result = await query('SELECT * FROM animals WHERE id=$1', [id]);
    debug({ id, count: result.rowCount }, 'DAO: fetched animal by id');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching animal');
    throw err;
  }
}

async function create({name, age, type, health, gender, color, weight, personality, size, history, shelter_id}) {
  try {
    const result = await query(
      'INSERT INTO animals(name, age, type, health, gender, color, weight, photo, personality, size, history, shelter_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [name, age, type, health, gender, color, weight, personality, size, history, shelter_id]
    );
    info({ animal: result.rows[0] }, 'DAO: created animal');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating animal');
    throw err;
  }
}

async function update(id, {name, age, type, health, gender, color, weight, personality, size, history, shelter_id }) {
  try {
    const result = await query(
      'UPDATE animals SET  name=$1, age=$2, type=$3, health=$4, gender=$5, color=$6, weight=$7, personality=$8, size=$9, history=$10, shelter_id=$11 WHERE id=$12 RETURNING *',
      [name, age, type, health, gender, color, weight, personality, size, history, shelter_id, id]
    );
    info({ id, updated: result.rowCount }, 'DAO: updated animal');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error updating animal');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await query('DELETE FROM animals WHERE id=$1 RETURNING *', [id]);
    info({ id, deleted: result.rowCount }, 'DAO: deleted animal');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error deleting animal');
    throw err;
  }
}

export default { getAll, getById, create, update, remove, getAnimalsByShelter };
