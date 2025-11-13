const Joi = require('joi');
const animalsDao = require('../dao/animalsDao');

// Joi-схема для валидации animal
const animalSchema = Joi.object({
  name: Joi.string().min(2).required(),
  age: Joi.number().integer().min(0).required(),
  type: Joi.string().valid('dog','cat','other').required(),
  shelter_id: Joi.number().integer().required()
});

// Получить всех животных
async function getAllAnimals() {
  return animalsDao.getAll();
}

// Получить животное по id
async function getAnimalById(id) {
  return animalsDao.getById(id);
}

async function getAnimalsByShelterId(id) {
  return animalsDao.getAnimalsByShelter(id);
}

// Создать животное
async function createAnimal(data) {
  // const { error, value } = animalSchema.validate(data);
  // if (error) throw new Error(error.details[0].message);
  return animalsDao.create(data);
}

// Обновить животное
async function updateAnimal(id, data) {
  const { error, value } = animalSchema.validate(data);
  if (error) throw new Error(error.details[0].message);
  return animalsDao.update(id, value);
}

// Удалить животное
async function removeAnimal(id) {
  return animalsDao.remove(id);
}

module.exports = { getAllAnimals, getAnimalById, createAnimal, updateAnimal, removeAnimal, getAnimalsByShelterId };
