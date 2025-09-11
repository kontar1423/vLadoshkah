const express = require('express');
const router = express.Router();
const animalsController = require('../controllers/animalsController');

router.get('/', animalsController.getAll);          // GET /animals
router.get('/:id', animalsController.getById);      // GET /animals/:id
router.post('/', animalsController.create);        // POST /animals
router.put('/:id', animalsController.update);      // PUT /animals/:id
router.delete('/:id', animalsController.remove);   // DELETE /animals/:id

module.exports = router;
