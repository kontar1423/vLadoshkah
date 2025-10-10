import { object, string, number } from 'joi';
import animalsDao from '../dao/animalsDao';
import photosDao from '../dao/photosDao';

// Joi-схема для валидации animal
const animalSchema = object({
  name: string().min(2).required(),
  age: number().integer().min(0).required(),
  type: string().valid('dog','cat','other').required(),
  shelter_id: number().integer().required()
});

// Получить всех животных
async function getAllAnimals() {
    const photos = await photosDao.getByEntityType('animal');
    const animals = await animalsDao.getAll()
    const animalsWithPhotos = animals.map(animal => ({
    ...animal,
    photos: photos
      .filter(p => p.entity_id === animal.id)
      .map(p => p.url)
  }));
    return animalsWithPhotos;
  }

// Получить животное по id
async function getAnimalById(id) {
  animal = await animalsDao.getById(id);
  photo = await photosDao.getByEntity('animal', animal.id);
  return {
    ...animal,
    photos: photos.map(photo => photo.url)
  };
}

async function getAnimalsByShelterId(id) {
  const animals = animalsDao.getAnimalsByShelter(id);
  const photos = await photosDao.getByEntityType('animal');
  const animalsWithPhotos = animals.map(animal => ({
    ...animal,
    photos: photos
      .filter(p => p.entity_id === animal.id)
      .map(p => p.url)
  }));
    return animalsWithPhotos;
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

export default { getAllAnimals, getAnimalById, createAnimal, updateAnimal, removeAnimal, getAnimalsByShelterId };
