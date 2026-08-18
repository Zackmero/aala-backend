const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogosController');
const verificarToken = require('../middlewares/authMiddleware');


router.get('/', verificarToken, catalogoController.obtenerCatalogos);

module.exports = router;