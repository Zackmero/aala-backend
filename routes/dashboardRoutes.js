const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verificarToken = require('../middlewares/authMiddleware');


router.get('/proximos-vencimientos', dashboardController.obtenerProximosVencimientos);


module.exports = router;