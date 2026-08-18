const express = require('express');
const router = express.Router();
const perfilFiscalController = require('../controllers/perfilFiscalController');
const verificarToken = require('../middlewares/authMiddleware'); 

// Protegemos todas las rutas contables
router.get('/', verificarToken, perfilFiscalController.obtenerDirectorio);
router.get('/cliente/:cliente_id', verificarToken, perfilFiscalController.obtenerPerfil);
router.post('/', verificarToken, perfilFiscalController.crearPerfil);

// Rutas para trámites fiscales
router.get('/tramites/:perfil_id', verificarToken, perfilFiscalController.obtenerTramitesFiscales);
router.post('/tramites', verificarToken, perfilFiscalController.registrarTramiteFiscal);

module.exports = router;