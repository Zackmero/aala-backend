const dashboardModel = require('../models/dashboardModel');

const dashboardController = {
  obtenerResumen: async (req, res) => {
    try {
      const resumen = await dashboardModel.obtenerResumen();
      res.status(200).json(resumen);
    } catch (error) {
      console.error("Error al obtener el resumen del dashboard:", error);
      res.status(500).json({ mensaje: "No se pudo cargar el resumen del despacho" });
    }
  },

  obtenerProximosVencimientos: async (req, res) => {
    try {
    
      const vencimientos = await dashboardModel.obtenerProximosVencimientos();
      res.status(200).json(vencimientos);
    } catch (error) {
      console.error("Error al obtener proximos vencimientos:", error);
      res
        .status(500)
        .json({
          mensaje: "Error al cargar los proximos vencimientos",
          error: error.message,
        });
    }
  },
};

module.exports = dashboardController;
