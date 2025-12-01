import { query } from '../db.js';
import { debug, info, error } from '../logger.js';

async function create({ user_id, shelter_id, vote }) {
  try {
    const result = await query(
      `INSERT INTO votes (user_id, shelter_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, shelter_id)
       DO UPDATE SET vote = EXCLUDED.vote
       RETURNING *`,
      [user_id, shelter_id, vote]
    );
    info({ vote: result.rows[0] }, 'DAO: upserted service vote');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating service vote');
    throw err;
  }
}

async function update({ id, vote }) {
  try {
    const result = await query(
      `UPDATE votes
       SET vote = $1
       WHERE id = $2
       RETURNING *`,
      [vote, id]
    );
    info({ id, vote: result.rows[0] }, 'DAO: updated service vote');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error updating service vote');
    throw err;
  }
}

async function getByUserAndShelter(user_id, shelter_id) {
  try {
    const result = await query(
      `SELECT * FROM votes WHERE user_id = $1 AND shelter_id = $2`,
      [user_id, shelter_id]
    );
    debug({ user_id, shelter_id, found: !!result.rows[0] }, 'DAO: fetched vote by user and shelter');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error fetching vote by user and shelter');
    throw err;
  }
}

async function getAllByShelterId(shelter_id) {
  try {
    const result = await query(
      `SELECT * FROM votes WHERE shelter_id = $1`,
      [shelter_id]
    );
    debug({ shelter_id, count: result.rowCount }, 'DAO: fetched votes by shelter');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching votes by shelter');
    throw err;
  }
}

export default {
  create,
  update,
  getByUserAndShelter,
  getAllByShelterId,
};
