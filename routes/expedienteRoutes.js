
const express = require('express');
const router = express.Router();
const expedienteController = require('../controllers/expedienteController');
const verificarToken = require('../middlewares/authMiddleware');


router.get('/', verificarToken, expedienteController.obtenerExpedientes);
router.post('/', verificarToken, expedienteController.crearExpediente);
router.put('/:id', verificarToken, expedienteController.actualizarExpediente);

router.get('/:id', verificarToken, expedienteController.obtenerExpedientePorId);

module.exports = router;