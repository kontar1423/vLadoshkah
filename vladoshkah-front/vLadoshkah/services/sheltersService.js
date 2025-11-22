const Joi = require('joi');
const sheltersDao = require('../dao/sheltersDao');

// Joi-схема для валидации shelter
const shelterSchema = Joi.object({
  name: Joi.string().min(2).required()
});

// Получить все приюты
async function getAllShelters() {
  return sheltersDao.getAll();
}

// Получить приют по id
async function getShelterById(id) {
  return sheltersDao.getById(id);
}

// Создать приют
async function createShelter(data) {
  // const { error, value } = shelterSchema.validate(data);
  // if (error) throw new Error(error.details[0].message);
  return sheltersDao.create(data);
}

// Обновить приют
async function updateShelter(id, data) {
  const { error, value } = shelterSchema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return sheltersDao.update(id, value.name);
}

// Удалить приют
async function removeShelter(id) {
  return sheltersDao.remove(id);
}

module.exports = { getAllShelters, getShelterById, createShelter, updateShelter, removeShelter };
