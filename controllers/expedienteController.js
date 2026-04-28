const Expediente = require('../models/expedienteModel');

// POST: Crear nuevo expediente
const crearExpediente = async (req, res) => {
    try {
        // 1. Guardamos el expediente y obtenemos el ID y Título generado
        const { id, titulo } = await Expediente.crear(req.body);

        // 2. Guardamos en bitácora
        const descripcionBitacora = `Abrió el ${titulo}`;
        await Expediente.registrarEnBitacora(req.body.creado_por, id, descripcionBitacora);

        // 3. Respondemos a Vue
        res.status(201).json({
            mensaje: "Expediente creado exitosamente",
            expediente_id: id,
            titulo: titulo
        });
    } catch (error) {
        console.error("Error al crear el expediente:", error);
        res.status(500).json({ mensaje: "Error interno al guardar", error: error.message });
    }
};

// GET: Listar todos
const obtenerExpedientes = async (req, res) => {
    try {
        const expedientes = await Expediente.obtenerTodos();
        res.status(200).json(expedientes);
    } catch (error) {
        console.error("Error al obtener:", error);
        res.status(500).json({ mensaje: "Error al cargar", error: error.message });
    }
};

// GET: Listar expediente por ID (para editar)
const obtenerExpedientePorId = async (req, res) => {
    try{
        const {id} = req.params;
        const expediente = await Expediente.obtenerPorId(id);
        if (!expediente) {
            return res.status(404).json({ mensaje: "Expediente no encontrado" });
        }
        res.status(200).json(expediente);
    }catch (error) {
        console.error("Error al obtener por ID:", error);
        res.status(500).json({ mensaje: "Error al cargar", error: error.message });
    }
}

// PUT: Actualizar expediente
const actualizarExpediente = async (req, res) => {
    try {
        const { id } = req.params;
        await Expediente.actualizar(id, req.body);
        res.status(200).json({ mensaje: "Expediente actualizado" });
    } catch (error) {
        console.error("Error al actualizar:", error);
        res.status(500).json({ mensaje: "Error al actualizar", error: error.message });
    }
};

module.exports = {
    crearExpediente,
    obtenerExpedientes,
    actualizarExpediente,
    obtenerExpedientePorId
};