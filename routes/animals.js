import { Router } from 'express';
const router = Router();
import { getAll, getById, create, update, remove } from '../controllers/animalsController';

router.get('/', getAll);          // GET /animals
router.get('/:id', getById);      // GET /animals/:id
router.post('/', create);        // POST /animals
router.put('/:id', update);      // PUT /animals/:id
router.delete('/:id', remove);   // DELETE /animals/:id

export default router;
