import { object, string } from 'joi';
import sheltersDao from '../dao/sheltersDao';

// Joi-схема для валидации shelter
const shelterSchema = object({
  name: string().min(2).required()
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

export default { getAllShelters, getShelterById, createShelter, updateShelter, removeShelter };
