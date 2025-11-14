import { query } from '../db.js'; // ← Импортируем query
import { debug, info, error } from '../logger.js'; // ← Импортируем логгеры

async function getAll() {
  try {
    const result = await query(`
      SELECT a.*, s.name as shelter_name 
      FROM animals a 
      LEFT JOIN shelters s ON a.shelter_id = s.id 
    `);
    debug({ count: result.rowCount }, 'DAO: fetched all animals');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching all animals');
    throw err;
  }
}

async function getAnimalsByShelter(id) {
  try {
    const result = await query(`
      SELECT a.*, s.name as shelter_name 
      FROM animals a 
      LEFT JOIN shelters s ON a.shelter_id = s.id 
      WHERE a.shelter_id = $1 
    `, [id]);
    debug({ id, count: result.rowCount }, 'DAO: fetched animals by shelterId');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching animals by shelterId');
    throw err;
  }
}

async function getById(id) {
  try {
    const result = await query(`
      SELECT a.*, s.name as shelter_name 
      FROM animals a 
      LEFT JOIN shelters s ON a.shelter_id = s.id 
      WHERE a.id = $1
    `, [id]);
    debug({ id, count: result.rowCount }, 'DAO: fetched animal by id');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error fetching animal');
    throw err;
  }
}

async function create({ name, age, type, health, gender, color, weight, personality, animal_size, history, shelter_id }) {
  try {
    const result = await query(
      `INSERT INTO animals(
        name, age, type, health, gender, color, weight, 
        personality, animal_size, history, shelter_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [name, age, type, health, gender, color, weight, personality, animal_size, history, shelter_id]
    );
    info({ animal: result.rows[0] }, 'DAO: created animal');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error creating animal');
    throw err;
  }
}

async function update(id, { name, age, type, health, gender, color, weight, personality, animal_size, history, shelter_id }) {
  try {
    const currentAnimal = await getById(id);
    if (!currentAnimal) {
      return null;
    }
    const updatedData = {
      name: name !== undefined ? name : currentAnimal.name,
      age: age !== undefined ? age : currentAnimal.age,
      type: type !== undefined ? type : currentAnimal.type,
      health: health !== undefined ? health : currentAnimal.health,
      gender: gender !== undefined ? gender : currentAnimal.gender,
      color: color !== undefined ? color : currentAnimal.color,
      weight: weight !== undefined ? weight : currentAnimal.weight,
      personality: personality !== undefined ? personality : currentAnimal.personality,
      animal_size: animal_size !== undefined ? animal_size : currentAnimal.animal_size,
      history: history !== undefined ? history : currentAnimal.history,
      shelter_id: shelter_id !== undefined ? shelter_id : currentAnimal.shelter_id,
    };
    const result = await query(
      `UPDATE animals SET name = $1, age = $2, type = $3, health = $4, gender = $5, color = $6, weight = $7, personality = $8, animal_size = $9, history = $10, shelter_id = $11, updated_at = current_timestamp WHERE id = $12 RETURNING *`,
      [updatedData.name, updatedData.age, updatedData.type, updatedData.health, updatedData.gender, updatedData.color, updatedData.weight, updatedData.personality, updatedData.animal_size, updatedData.history, updatedData.shelter_id, id]
    );
    info({ animal: result.rows[0] }, 'DAO: updated animal');
    return result.rows[0] || null;
  } catch (err) {
    error(err, 'DAO: error updating animal');
    throw err;
  }
}

async function remove(id) {
  try {
    const result = await query('DELETE FROM animals WHERE id = $1 RETURNING *', [id]);
    info({ animal: result.rows[0] }, 'DAO: deleted animal');
    return result.rows[0];
  } catch (err) {
    error(err, 'DAO: error deleting animal');
    throw err;
  }
}

// Дополнительные методы по необходимости
async function getByType(type) {
  try {
    const result = await query(
      `SELECT a.*, s.name as shelter_name 
       FROM animals a 
       LEFT JOIN shelters s ON a.shelter_id = s.id 
       WHERE a.type = $1`,
      [type]
    );
    debug({ type, count: result.rowCount }, 'DAO: fetched animals by type');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error fetching animals by type');
    throw err;
  }
}

async function searchAnimals(searchTerm) {
  try {
    const result = await query(
      `SELECT a.*, s.name as shelter_name 
       FROM animals a 
       LEFT JOIN shelters s ON a.shelter_id = s.id 
       WHERE a.name ILIKE $1 OR a.breed ILIKE $1 OR a.description ILIKE $1`,
      [`%${searchTerm}%`]
    );
    debug({ searchTerm, count: result.rowCount }, 'DAO: searched animals');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error searching animals');
    throw err;
  }
}
async function findAnimals(filters = {}) {
  try {
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    const {
      shelter_id,
      type,
      gender,
      age_min,
      age_max,
      animal_size,
      health,
      search,
      // можно добавить любые другие фильтры
    } = filters;

    // Базовый запрос
    let queryString = `
      SELECT a.*, s.name as shelter_name 
      FROM animals a 
      LEFT JOIN shelters s ON a.shelter_id = s.id 
    `;

    // Динамически добавляем условия WHERE
    if (shelter_id) {
      paramCount++;
      whereConditions.push(`a.shelter_id = $${paramCount}`);
      queryParams.push(shelter_id);
    }

    if (type) {
      paramCount++;
      whereConditions.push(`a.type = $${paramCount}`);
      queryParams.push(type);
    }

    if (gender) {
      paramCount++;
      whereConditions.push(`a.gender = $${paramCount}`);
      queryParams.push(gender);
    }

    if (animal_size) {
      paramCount++;
      whereConditions.push(`a.animal_size = $${paramCount}`);
      queryParams.push(animal_size);
    }

    if (health) {
      paramCount++;
      whereConditions.push(`a.health = $${paramCount}`);
      queryParams.push(health);
    }

    if (age_min !== undefined) {
      paramCount++;
      whereConditions.push(`a.age >= $${paramCount}`);
      queryParams.push(age_min);
    }

    if (age_max !== undefined) {
      paramCount++;
      whereConditions.push(`a.age <= $${paramCount}`);
      queryParams.push(age_max);
    }

    // Поиск по тексту (имя, описание и т.д.)
    if (search) {
      paramCount++;
      whereConditions.push(`(
        a.name ILIKE $${paramCount} OR 
        a.color ILIKE $${paramCount} OR 
        a.type ILIKE $${paramCount} OR
        a.personality ILIKE $${paramCount} OR
        a.history ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Добавляем WHERE если есть условия
    if (whereConditions.length > 0) {
      queryString += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Сортировка
    queryString += ` ORDER BY a.created_at DESC`;

    // Выполняем запрос
    const result = await query(queryString, queryParams);
    debug({ filters, count: result.rowCount }, 'DAO: found animals with filters');
    return result.rows;
  } catch (err) {
    error(err, 'DAO: error finding animals with filters');
    throw err;
  }
}
export default { 
  getAll, 
  getById, 
  create, 
  update, 
  remove, 
  getAnimalsByShelter,
  getByType,
  searchAnimals,
  findAnimals
};