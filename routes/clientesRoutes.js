const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', verificarToken, clientesController.obtenerClientes);
router.post('/', verificarToken, clientesController.crearCliente);
router.put('/:id', verificarToken, clientesController.actualizarCliente);
router.delete('/:id', verificarToken, clientesController.eliminarCliente);

module.exports = router;