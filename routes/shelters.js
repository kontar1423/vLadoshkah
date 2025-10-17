import { Router } from 'express';
const router = Router();
import sheltersControllerService from "../controllers/sheltersController.js";
import animalsControllerService from "../controllers/animalsController.js";

router.get('/', sheltersControllerService.getAll);          // GET /shelters
router.get('/:id', sheltersControllerService.getById);      // GET /shelters/:id
router.get('/:id/animals', sheltersControllerService.getById);    // GET /shelters/:id/animals
router.post('/', sheltersControllerService.create);        // POST /shelters
router.put('/:id', sheltersControllerService.update);      // PUT /shelters/:id
router.delete('/:id', sheltersControllerService.remove);   // DELETE /shelters/:id

export default router;


