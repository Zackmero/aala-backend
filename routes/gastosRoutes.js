const express = require("express");
const router = express.Router();
const gastosController = require("../controllers/gastosController");
const verificarToken = require("../middlewares/authMiddleware");
const uploadAWS = require("../middlewares/uploadAWS");

router.post('/expediente/:id', verificarToken, uploadAWS.single('comprobante_gasto'), gastosController.crearGasto);

router.get('/:id/comprobante', gastosController.verComprobante);
router.get("/", verificarToken, gastosController.obtenerGastos);
router.get('/expediente/:id', verificarToken, gastosController.obtenerGastosPorExpediente);

router.put('/expediente/:id', verificarToken, uploadAWS.single('comprobante_url_gasto'), gastosController.actualizarGasto);

router.delete('/expediente/:id', verificarToken, gastosController.eliminarGasto);


module.exports = router;
