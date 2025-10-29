import applicationsDao from '../dao/applicationsDao.js';
import logger from '../logger.js';
import redisClient from '../cache/redis-client.js';
const CACHE_KEYS = {
    ALL_APPLICATIONS: 'applications:all',
    APPLICATION_BY_ID: (id) => `application:${id}`,
};
async function create(applicationData) {
    try {
        const application = await applicationsDao.create(applicationData);
        if (!application) {
            throw new Error('Failed to create application');
        }
        
        // Инвалидируем кэш
        await Promise.all([
            redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS),
            redisClient.delete(CACHE_KEYS.APPLICATION_BY_ID(application.id))
        ]);
        
        return application;
    } catch (err) {
        logger.error(err, 'Service: error creating application');
        throw err;
    }
}
async function getById(id) {
    try {
        // Clear the specific application cache since we're fetching a single application
        await Promise.all([
            redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS),
            redisClient.delete(CACHE_KEYS.APPLICATION_BY_ID(id))
        ]);
        
        const application = await applicationsDao.getById(id);
        if (!application) {
            throw new Error('Application not found');
        }
        
        await redisClient.set(cacheKey, application, 300); // кэш на 5 минут
        return application;
    } catch (err) {
        logger.error(err, 'Service: error fetching application by id');
        throw err;
    }
}

async function getAll() {
    try {
        // Clear the all applications cache since we're fetching all applications
        await redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS);
        
        const applications = await applicationsDao.getAll();
        await redisClient.set(CACHE_KEYS.ALL_APPLICATIONS, applications, 300); // кэш на 5 минут
        return applications;
    } catch (err) {
        logger.error(err, 'Service: error fetching all applications');
        throw err;
    }
}

async function update(id, applicationData) {
    try {
        // Clear the specific application cache since we're updating a single application
        await Promise.all([
            redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS),
            redisClient.delete(CACHE_KEYS.APPLICATION_BY_ID(id))
        ]);
        const application = await applicationsDao.update(id, applicationData);
        if (!application) {
            throw new Error('Application not found');
        }
        
        // Инвалидируем кэш
        await Promise.all([
            redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS),
            redisClient.delete(CACHE_KEYS.APPLICATION_BY_ID(id))
        ]);
        
        return application;
    } catch (err) {
        logger.error(err, 'Service: error updating application');
        throw err;
    }
}

async function remove(id) {
    try {
        // Clear the specific application cache since we're removing a single application
        await Promise.all([
            redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS),
            redisClient.delete(CACHE_KEYS.APPLICATION_BY_ID(id))
        ]);
        const application = await applicationsDao.remove(id);
        if (!application) {
            throw new Error('Application not found');
        }
        
        // Инвалидируем кэш
        await Promise.all([
            redisClient.delete(CACHE_KEYS.ALL_APPLICATIONS),
            redisClient.delete(CACHE_KEYS.APPLICATION_BY_ID(id))
        ]);
        
        return application;
    } catch (err) {
        logger.error(err, 'Service: error removing application');
        throw err;
    }
}

async function countApproved() {
    try {
        const count = await applicationsDao.countByStatus('approved');
        return { count };
    } catch (err) {
        logger.error(err, 'Service: error counting approved applications');
        throw err;
    }
}

export default { create, getById, getAll, update, remove, countApproved };