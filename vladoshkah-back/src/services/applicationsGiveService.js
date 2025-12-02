import applicationsDao from '../dao/applicationsDao.js';
import animalsToGiveService from './animalsToGiveService.js';
import logger from '../logger.js';

function combine(application, animal) {
  return {
    ...application,
    animal
  };
}

function resolveDescription(data, fallbackName = 'animal') {
  if (data?.description) return data.description;
  if (data?.history) return data.history;
  if (data?.special_needs) return data.special_needs;
  return `Request to give ${fallbackName}`;
}

async function createGive(data, photoFile = null) {
  try {
    const {
      user_id,
      status = 'pending',
      shelter_id = null,
      name,
      species,
      breed,
      character,
      gender,
      birth_date,
      vaccination_status,
      health_status,
      special_needs,
      history
    } = data;

    const animal = await animalsToGiveService.create(
      {
        name,
        species,
        breed,
        character,
        gender,
        birth_date,
        vaccination_status,
        health_status,
        special_needs,
        history
      },
      photoFile
    );

    const description = resolveDescription(data, name);

    const application = await applicationsDao.create({
      user_id,
      shelter_id: shelter_id ?? null,
      animal_id: animal.id,
      status,
      description,
      type: 'give'
    });

    return combine(application, animal);
  } catch (err) {
    logger.error(err, 'Service: error creating give application');
    throw err;
  }
}

async function getGiveById(id) {
  try {
    const application = await applicationsDao.getById(id, 'give');
    if (!application) {
      const error = new Error('Application not found');
      error.status = 404;
      throw error;
    }

    const animal = application.animal_id
      ? await animalsToGiveService.getById(application.animal_id)
      : null;

    return combine(application, animal);
  } catch (err) {
    logger.error(err, 'Service: error fetching give application by id');
    throw err;
  }
}

async function getAllGive() {
  try {
    const applications = await applicationsDao.getAll({ type: 'give' });
    if (!applications.length) {
      return [];
    }

    const ids = applications
      .map((app) => app.animal_id)
      .filter((id) => Number.isInteger(id));

    const animals = await Promise.all(
      ids.map((id) => animalsToGiveService.getById(id))
    );

    const animalsMap = new Map();
    animals.forEach((animal) => {
      if (animal) animalsMap.set(animal.id, animal);
    });

    return applications.map((application) =>
      combine(application, animalsMap.get(application.animal_id) || null)
    );
  } catch (err) {
    logger.error(err, 'Service: error fetching give applications');
    throw err;
  }
}

async function updateGive(id, data, photoFile = null) {
  try {
    const application = await applicationsDao.getById(id, 'give');
    if (!application) {
      const error = new Error('Application not found');
      error.status = 404;
      throw error;
    }

    const animalId = application.animal_id;

    const animalPayload = {
      name: data.name,
      species: data.species,
      breed: data.breed,
      character: data.character,
      gender: data.gender,
      birth_date: data.birth_date,
      vaccination_status: data.vaccination_status,
      health_status: data.health_status,
      special_needs: data.special_needs,
      history: data.history
    };

    const shouldUpdateAnimal = Object.values(animalPayload).some((v) => v !== undefined) || photoFile;
    let updatedAnimal = await animalsToGiveService.getById(animalId);

    if (shouldUpdateAnimal) {
      updatedAnimal = await animalsToGiveService.update(animalId, animalPayload, photoFile);
    }

    const updatedApplication = await applicationsDao.update(
      id,
      {
        user_id: data.user_id,
        shelter_id: data.shelter_id ?? application.shelter_id ?? null,
        animal_id: animalId,
        status: data.status,
        description: data.description || application.description,
        type: 'give'
      },
      'give'
    );

    return combine(updatedApplication, updatedAnimal);
  } catch (err) {
    logger.error(err, 'Service: error updating give application');
    throw err;
  }
}

async function removeGive(id) {
  try {
    const application = await applicationsDao.getById(id, 'give');
    if (!application) {
      const error = new Error('Application not found');
      error.status = 404;
      throw error;
    }

    if (application.animal_id) {
      await animalsToGiveService.remove(application.animal_id);
    }

    const removedApp = await applicationsDao.remove(id, 'give');
    return combine(removedApp, null);
  } catch (err) {
    logger.error(err, 'Service: error removing give application');
    throw err;
  }
}

export default {
  createGive,
  getGiveById,
  getAllGive,
  updateGive,
  removeGive
};
