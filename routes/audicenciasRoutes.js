const express = require('express');
const router = express.Router();
const audienciasController = require('../controllers/audienciasController');
const verificarToken = require('../middlewares/authMiddleware');


router.get('/', verificarToken, audienciasController.obtenerAudiencias);
router.get('/expediente/:id', verificarToken, audienciasController.obtenerAudienciasPorExpedienteId);
router.post('/', verificarToken, audienciasController.crearAudiencia);
router.put('/:id', verificarToken, audienciasController.actualizarAudiencia);
router.delete('/:id', verificarToken, audienciasController.eliminarAudiencia);

module.exports = router;