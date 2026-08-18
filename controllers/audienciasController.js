const Audiencias = require("../models/audienciasModel");

const obtenerAudiencias = async (req, res) => {
  try {
    const audiencias = await Audiencias.obtenerTodos();
    res.status(200).json(audiencias);
  } catch (error) {
    console.error("Error al obtener audiencias:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const obtenerAudienciasPorExpedienteId = async (req, res) => {
  try {
    const expedienteId = req.params.id;
    const audiencias = await Audiencias.obtenerPorExpedienteId(expedienteId);
    res.status(200).json(audiencias);
  } catch (error) {
    console.error("Error al obtener audiencias:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const obtenerAudienciaPorId = async (req, res) => {
  try {
    const audienciaId = req.params.id;
    const audiencia = await Audiencias.obtenerPorId(audienciaId);
    if (!audiencia) {
      return res.status(404).json({ mensaje: "Audiencia no encontrada" });
    }
    res.status(200).json(audiencia);
  } catch (error) {
    console.error("Error al obtener audiencia por ID:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const crearAudiencia = async (req, res) => {
  try {
    const audienciaData = req.body;
    const audiencia = await Audiencias.crear(audienciaData);
    res.status(201).json({ mensaje: "Audiencia creada", audiencia });
  } catch (error) {
    console.error("Error al crear audiencia:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const actualizarAudiencia = async (req, res) => {
  try {
    const audienciaId = req.params.id;
    const audienciaData = req.body;
    const audiencia = await Audiencias.actualizar(audienciaId, audienciaData);
    res.status(200).json({ mensaje: "Audiencia actualizada", audiencia });
  } catch (error) {
    console.error("Error al actualizar audiencia:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const eliminarAudiencia = async (req, res) => {
  try {
    const audienciaId = req.params.id;
    await Audiencias.eliminar(audienciaId);
    res.status(200).json({ mensaje: "Audiencia eliminada" });
  } catch (error) {
    console.error("Error al eliminar audiencia:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  obtenerAudiencias,
  obtenerAudienciasPorExpedienteId,
  crearAudiencia,
  actualizarAudiencia,
  eliminarAudiencia,
  obtenerAudienciaPorId,
};
