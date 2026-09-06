const Expediente = require('../models/expedienteModel');

// POST: Crear nuevo expediente
const crearExpediente = async (req, res) => {
    try {
        // La autoría se toma SIEMPRE del token, nunca de lo que mande el navegador.
        const usuarioId = req.usuario?.id ?? null;

        // 1. Guardamos el expediente y obtenemos el ID y Título generado
        const { id, titulo } = await Expediente.crear({
            ...req.body,
            creado_por: usuarioId,
            actualizado_por: usuarioId,
        });

        // 2. Guardamos en bitácora
        const descripcionBitacora = `Abrió el ${titulo}`;
        await Expediente.registrarEnBitacora(usuarioId, id, descripcionBitacora);

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

        const expedienteActual = await Expediente.obtenerPorId(id);
        if (!expedienteActual) {
            return res.status(404).json({ mensaje: "Expediente no encontrado" });
        }

        const datos = { ...req.body };

        // Reasignar el expediente a otro abogado es facultad exclusiva del socio.
        // Se valida AQUI, en el servidor: el select deshabilitado del formulario
        // es solo cortesia visual y cualquiera podria saltarselo desde la consola.
        const cambiaAbogado =
            datos.abogado_id !== undefined &&
            datos.abogado_id !== null &&
            String(datos.abogado_id) !== "" &&
            Number(datos.abogado_id) !== Number(expedienteActual.abogado_id);

        if (cambiaAbogado && Number(req.usuario?.es_socio) !== 1) {
            return res.status(403).json({
                mensaje: "Solo un socio del despacho puede reasignar el expediente a otro abogado.",
            });
        }

        const actualizado = await Expediente.actualizar(id, {
            ...datos,
            actualizado_por: req.usuario?.id ?? null,
        });

        if (!actualizado) {
            return res.status(400).json({ mensaje: "No se recibió ningún campo para actualizar" });
        }

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