import applicationsDao from '../dao/applicationsDao.js';
import logger from '../logger.js';
import redisClient from '../cache/redis-client.js';

async function create(applicationData) {
    try {
        const application = await applicationsDao.create(applicationData);
        if (!application) {
            throw new Error('Failed to create application');
        }
        
        // Инвалидируем кэш
        await redisClient.delete('applications:all');
        
        return application;
    } catch (err) {
        logger.error(err, 'Service: error creating application');
        throw err;
    }
}
async function getById(id) {
    try {
        const cacheKey = `applications:${id}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return cached;
        }
        
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
        const cacheKey = 'applications:all';
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return cached;
        }
        
        const applications = await applicationsDao.getAll();
        await redisClient.set(cacheKey, applications, 300); // кэш на 5 минут
        return applications;
    } catch (err) {
        logger.error(err, 'Service: error fetching all applications');
        throw err;
    }
}

async function update(id, applicationData) {
    try {
        const application = await applicationsDao.update(id, applicationData);
        if (!application) {
            throw new Error('Application not found');
        }
        
        // Инвалидируем кэш
        await redisClient.delete('applications:all');
        await redisClient.delete(`applications:${id}`);
        
        return application;
    } catch (err) {
        logger.error(err, 'Service: error updating application');
        throw err;
    }
}

async function remove(id) {
    try {
        const application = await applicationsDao.remove(id);
        if (!application) {
            throw new Error('Application not found');
        }
        
        // Инвалидируем кэш
        await redisClient.delete('applications:all');
        await redisClient.delete(`applications:${id}`);
        
        return application;
    } catch (err) {
        logger.error(err, 'Service: error removing application');
        throw err;
    }
}

export default { create, getById, getAll, update, remove };