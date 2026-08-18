// routes/documentosRoutes.js
const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentosController');
const upload = require('../middlewares/uploadAWS');
const verificarToken = require('../middlewares/authMiddleware');

// upload.array('archivos', 10) significa que buscará un campo llamado 'archivos' y aceptará máximo 10 de golpe
router.post('/expediente/:id', verificarToken, upload.array('archivos', 10), documentosController.subirDocumentos);

router.get('/expediente/:id', verificarToken, documentosController.obtenerDocumentos);

router.delete('/:expedienteId/:documentoId', verificarToken, documentosController.eliminarDocumento);

module.exports = router;