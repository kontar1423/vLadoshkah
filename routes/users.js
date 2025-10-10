import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/usersController';

const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
