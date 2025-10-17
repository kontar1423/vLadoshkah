import photosService from '../services/photosService.js';

class PhotosController {
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { entity_type, entity_id } = req.body;
            
            if (!entity_type || !entity_id) {
                return res.status(400).json({ 
                    error: 'entity_type and entity_id are required' 
                });
            }

            // Используем сервис для загрузки фото
            const photo = await photosService.uploadPhoto(
                req.file, 
                entity_type, 
                entity_id
            );

            res.status(201).json({
                id: photo.id,
                original_name: photo.original_name,
                object_name: photo.object_name,
                url: photo.url,
                entity_type: photo.entity_type,
                entity_id: photo.entity_id,
                size: photo.size,
                mimetype: photo.mimetype,
                uploaded_at: photo.uploaded_at
            });

        } catch (error) {
            console.error('Upload photo error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getPhotoFile(req, res) {
        try {
            const { objectName } = req.params;
            
            // Получаем информацию о фото
            const photo = await photosService.getPhotoFileInfo(objectName);
            
            // Получаем файл из MinIO через сервис
            const dataStream = await photosService.getPhotoFile(objectName);

            res.setHeader('Content-Type', photo.mimetype);
            res.setHeader('Content-Length', photo.size);
            res.setHeader('Content-Disposition', `inline; filename="${photo.original_name}"`);

            dataStream.pipe(res);

        } catch (error) {
            console.error('Get photo file error:', error);
            if (error.code === 'NoSuchKey' || error.message === 'Photo not found') {
                return res.status(404).json({ error: 'Photo not found' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    async getPhotoInfo(req, res) {
        try {
            const { id } = req.params;
            const photo = await photosService.getPhoto(id);
            
            if (!photo) {
                return res.status(404).json({ error: 'Photo not found' });
            }

            res.json(photo);
        } catch (error) {
            console.error('Get photo info error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async deletePhoto(req, res) {
        try {
            const { id } = req.params;
            
            // Используем сервис для удаления (MinIO + БД)
            await photosService.deletePhoto(id);

            res.json({ message: 'Photo deleted successfully' });

        } catch (error) {
            console.error('Delete photo error:', error);
            if (error.message === 'Photo not found') {
                return res.status(404).json({ error: 'Photo not found' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    async getPhotosByEntity(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const photos = await photosService.getPhotosByEntity(entityType, parseInt(entityId));
            res.json(photos);
        } catch (error) {
            console.error('Get photos by entity error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getAllPhotos(req, res) {
        try {
            const photos = await photosService.getAllPhotos();
            res.json(photos);
        } catch (error) {
            console.error('Get all photos error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getPhotosByEntityType(req, res) {
        try {
            const { entityType } = req.params;
            const photos = await photosService.getPhotosByEntityType(entityType);
            res.json(photos);
        } catch (error) {
            console.error('Get photos by entity type error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

export default new PhotosController();