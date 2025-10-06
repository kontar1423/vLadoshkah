import { PhotosService } from '../services/photosService.js';

export const PhotosController = {
    async getAll(req, res) {
        const photos = await PhotosService.getAllPhotos();
        res.json(photos);
    },

    async getById(req, res) {
        const photo = await PhotosService.getPhotoById(req.params.id);
        if (!photo) return res.status(404).json({ message: 'Photo not found' });
        res.json(photo);
    },

    async getByEntity(req, res) {
        const { type, id } = req.params;
        const photos = await PhotosService.getPhotosByEntity(type, id);
        res.json(photos);
    },

    async create(req, res) {
        const { url, entity_id, entity_type } = req.body;
        if (!url || !entity_id || !entity_type)
            return res.status(400).json({ message: 'Not enough info' });

        const photo = await PhotosService.createPhoto({ url, entity_id, entity_type });
        res.status(201).json(photo);
    },

    async delete(req, res) {
        const photo = await PhotosService.deletePhoto(req.params.id);
        if (!photo) return res.status(404).json({ message: 'Photo not found' });
        res.json({ message: 'Photo was deleted', photo });
    },
};
