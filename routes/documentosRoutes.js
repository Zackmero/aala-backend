// routes/documentosRoutes.js
const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentosController');
const upload = require('../middlewares/upload');

// upload.array('archivos', 10) significa que buscará un campo llamado 'archivos' y aceptará máximo 10 de golpe
router.post('/', upload.array('archivos', 10), documentosController.subirDocumentos);

router.get('/expediente/:id', documentosController.obtenerDocumentos);

module.exports = router;