import { Router } from 'express';
import usersControllerService from "../controllers/usersController.js";

const router = Router();

router.get('/', usersControllerService.getAll);
router.get('/:id', usersControllerService.getById);
router.post('/', usersControllerService.create);
router.put('/:id', usersControllerService.update);
router.delete('/:id', usersControllerService.remove);

export default router;


