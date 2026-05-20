const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const upload = require('../middlewares/upload');


// POST para crear un nuevo pago
router.post('/', upload.single('comprobante'), pagoController.crearPago);

// GET para obtener todos los pagos de un expediente específico
router.get('/:id', pagoController.obtenerPagos);   
router.put('/:id', upload.single('comprobante'), pagoController.actualizaPago);
router.delete('/:id', pagoController.eliminarPago);

module.exports = router;