
const express = require('express');
const router = express.Router();
const expedienteController = require('../controllers/expedienteController');


router.get('/', expedienteController.obtenerExpedientes);
router.post('/', expedienteController.crearExpediente);
router.put('/:id', expedienteController.actualizarExpediente);

router.get('/:id', expedienteController.obtenerExpedientePorId);

module.exports = router;