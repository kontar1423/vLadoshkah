import applicationsService from '../services/applicationsService.js';
import logger from '../logger.js';

async function create(req, res) {
    try {
        const applicationData = req.body;
        const application = await applicationsService.create(applicationData);
        res.status(201).json(application);
    } catch (err) {
        const log = req.log || logger;
        log.error(err, 'Controller: error creating application');
        res.status(500).json({ error: 'Internal server error' });
    }
}   
async function getById(req, res) {
    try {
        const { id } = req.params;
        const application = await applicationsService.getById(id);
        res.json(application);
    } catch (err) {
        const log = req.log || logger;
        log.error(err, 'Controller: error fetching application by id');
        res.status(404).json({ error: err.message || 'Application not found' });
    }
}

async function getAll(req, res) {
    try {
        const applications = await applicationsService.getAll();
        res.json(applications);
    } catch (err) {
        const log = req.log || logger;
        log.error(err, 'Controller: error fetching all applications');
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function update(req, res) {
    try {
        const { id } = req.params;
        const applicationData = req.body;
        const application = await applicationsService.update(id, applicationData);
        res.json(application);
    } catch (err) {
        const log = req.log || logger;
        log.error(err, 'Controller: error updating application');
        res.status(404).json({ error: err.message || 'Application not found' });
    }
}

async function remove(req, res) {
    try {
        const { id } = req.params;
        const application = await applicationsService.remove(id);
        res.json(application);
    } catch (err) {
        const log = req.log || logger;
        log.error(err, 'Controller: error removing application');
        res.status(404).json({ error: err.message || 'Application not found' });
    }
}

async function countApproved(req, res) {
    try {
        const result = await applicationsService.countApproved();
        res.json(result);
    } catch (err) {
        const log = req.log || logger;
        log.error(err, 'Controller: error counting approved applications');
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default {
    create,
    getById,
    getAll,
    update,
    remove,
    countApproved
};
