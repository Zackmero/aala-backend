const dashboardModel = require('../models/dashboardModel');

const dashboardController = {
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
