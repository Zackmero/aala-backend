const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const uploadAWS = require('../middlewares/uploadAWS');
const verificarToken = require('../middlewares/authMiddleware');

// POST para crear un nuevo pago
router.post('/', verificarToken, uploadAWS.single('comprobante_pago'), pagoController.crearPago);

// GET para obtener todos los pagos de un expediente específico
router.get('/', verificarToken, pagoController.obtenerListaPagos);
router.get('/total', verificarToken, pagoController.obtenerTotalPagos);
router.get('/:id', verificarToken, pagoController.obtenerPagosPorId);   
router.put('/:id', verificarToken, uploadAWS.array('comprobante_url_pago', 1), pagoController.actualizaPago);
router.delete('/:id', verificarToken, pagoController.eliminarPago);
router.get('/:id/comprobante', pagoController.verComprobante);

module.exports = router;