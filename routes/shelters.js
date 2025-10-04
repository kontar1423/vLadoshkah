const express = require('express');
const router = express.Router();
const sheltersController = require('../controllers/sheltersController');
const animalsController = require('../controllers/animalsController');

router.get('/', sheltersController.getAll);          // GET /shelters
router.get('/:id', sheltersController.getById);      // GET /shelters/:id
router.get('/:id/animals', animalsController.getAllByShelterId);    // GET /shelters/:id/animals
router.post('/', sheltersController.create);        // POST /shelters
router.put('/:id', sheltersController.update);      // PUT /shelters/:id
router.delete('/:id', sheltersController.remove);   // DELETE /shelters/:id

module.exports = router;
