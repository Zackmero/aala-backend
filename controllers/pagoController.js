const Pago = require('../models/pagoModel');

const crearPago = async (req, res) => {
    try {
        // Extraemos los datos que nos mandará Vue
        const { expediente_id, concepto, tipo, monto, fecha_vencimiento, estatus, notas, registrado_por } = req.body;

        const nuevoId = await Pago.crear({
            expediente_id,
            concepto,
            tipo,
            monto,
            fecha_vencimiento,
            estatus,
            notas,
            registrado_por
        });

        res.status(201).json({ mensaje: "Cobro registrado exitosamente", id: nuevoId });
    } catch (error) {
        console.error("Error al registrar pago:", error);
        res.status(500).json({ mensaje: "Error al guardar el pago", error: error.message });
    }
};

const obtenerPagos = async (req, res) => {
    try {
        const { id } = req.params; // ID del expediente
        const pagos = await Pago.obtenerPorExpediente(id);
        res.status(200).json(pagos);
    } catch (error) {
        console.error("Error al obtener pagos:", error);
        res.status(500).json({ mensaje: "Error al cargar los pagos", error: error.message });
    }
};

const actualizaPago = async (req, res) => {
    try {
        const { id } = req.params; 
        const datosActualizados = req.body;

        if(req.file) {
            datosActualizados.comprobante_url = `/uploads/documentos/${req.file.filename}`;
        }

        const filasAfectadas =  await Pago.actualizar(id, datosActualizados);
        if (filasAfectadas === 0) {
            return res.status(404).json({ mensaje: "Pago no encontrado" });
        }

        res.status(200).json({ mensaje: "Pago actualizado exitosamente" });
    } catch (error) {
        console.error("Error al actualizar pago:", error);
        res.status(500).json({ mensaje: "Error al actualizar el pago", error: error.message });
    }
};

const eliminarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const filasAfectadas = await Pago.eliminar(id);
        if (filasAfectadas === 0) {
            return res.status(404).json({ mensaje: "Pago no encontrado" });
        }
        res.status(200).json({ mensaje: "Pago eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar pago:", error);
        res.status(500).json({ mensaje: "Error al eliminar el pago", error: error.message });
    }
};

module.exports = { crearPago, obtenerPagos, actualizaPago, eliminarPago };