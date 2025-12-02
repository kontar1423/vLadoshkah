import applicationsService from '../services/applicationsService.js';
import applicationsGiveService from '../services/applicationsGiveService.js';
import logger from '../logger.js';

async function createTake(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const applicationData = {
      ...req.body,
      user_id: Number(req.user.userId)
    };
    const application = await applicationsService.createTake(applicationData);
    res.status(201).json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating take application');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
}

async function getTakeById(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationsService.getTakeById(id);
    res.json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching take application by id');
    res.status(404).json({ error: err.message || 'Application not found' });
  }
}

async function getTakeByAnimalId(req, res) {
  try {
    const { id } = req.params;
    const applications = await applicationsService.getTakeByAnimalId(id);
    res.json(applications);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching take applications by animal id');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAllTake(req, res) {
  try {
    const applications = await applicationsService.getAllTake();
    res.json(applications);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching all take applications');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateTake(req, res) {
  try {
    const { id } = req.params;
    const applicationData = req.body;
    const application = await applicationsService.updateTake(id, applicationData);
    res.json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating take application');
    res.status(404).json({ error: err.message || 'Application not found' });
  }
}

async function removeTake(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationsService.removeTake(id);
    res.json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error removing take application');
    res.status(404).json({ error: err.message || 'Application not found' });
  }
}

async function countApprovedTake(req, res) {
  try {
    const result = await applicationsService.countApprovedTake();
    res.json(result);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error counting approved take applications');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createGive(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const applicationData = {
      ...req.body,
      user_id: Number(req.user.userId)
    };
    const photoFile = req.file || req.files?.photo?.[0] || req.files?.photos?.[0] || null;
    const application = await applicationsGiveService.createGive(applicationData, photoFile);
    res.status(201).json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating give application');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  }
}

async function getGiveById(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationsGiveService.getGiveById(id);
    res.json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching give application by id');
    res.status(err.status || 404).json({ error: err.message || 'Application not found' });
  }
}

async function getAllGive(req, res) {
  try {
    const applications = await applicationsGiveService.getAllGive();
    res.json(applications);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching all give applications');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateGive(req, res) {
  try {
    const { id } = req.params;
    const applicationData = req.body;
    const photoFile = req.file || req.files?.photo?.[0] || req.files?.photos?.[0] || null;
    const application = await applicationsGiveService.updateGive(id, applicationData, photoFile);
    res.json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating give application');
    res.status(err.status || 404).json({ error: err.message || 'Application not found' });
  }
}

async function removeGive(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationsGiveService.removeGive(id);
    res.json(application);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error removing give application');
    res.status(err.status || 404).json({ error: err.message || 'Application not found' });
  }
}

export default {
  createTake,
  getTakeById,
  getTakeByAnimalId,
  getAllTake,
  updateTake,
  removeTake,
  countApprovedTake,
  createGive,
  getGiveById,
  getAllGive,
  updateGive,
  removeGive
};
