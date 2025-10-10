import { Router } from 'express';
const router = Router();
import { getAll, getById, create, update, remove } from '../controllers/sheltersController';
import { getAllByShelterId } from '../controllers/animalsController';

router.get('/', getAll);          // GET /shelters
router.get('/:id', getById);      // GET /shelters/:id
router.get('/:id/animals', getAllByShelterId);    // GET /shelters/:id/animals
router.post('/', create);        // POST /shelters
router.put('/:id', update);      // PUT /shelters/:id
router.delete('/:id', remove);   // DELETE /shelters/:id

export default router;
