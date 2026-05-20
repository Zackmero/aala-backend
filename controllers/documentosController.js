// controllers/documentoController.js
const Documento = require('../models/documentoModel');

const subirDocumentos = async (req, res) => {
    try {
        // req.body trae los textos (tipo, notas, expediente_id)
        const { expediente_id, tipo, notas, subido_por } = req.body;
        
        // req.files trae los archivos físicos (gracias a Multer)
        const archivos = req.files; 

        if (!archivos || archivos.length === 0) {
            return res.status(400).json({ mensaje: "No se seleccionó ningún archivo." });
        }

        // Preparamos los datos exactos como los pide el Modelo (Bulk Insert)
        const datosParaInsertar = archivos.map(archivo => [
            expediente_id,
            archivo.originalname, // Ej: foto_ine.jpg
            archivo.filename,     // Ej: 1234567-foto_ine.jpg
            `/uploads/documentos/${archivo.filename}`, // La URL para que Vue lo encuentre
            tipo,
            notas || '',
            subido_por
        ]);

        // Mandamos a guardar a MySQL
        const cantidadGuardada = await Documento.crearMultiples(datosParaInsertar);

        res.status(201).json({ 
            mensaje: "Archivos guardados con éxito", 
            cantidad: cantidadGuardada 
        });

    } catch (error) {
        console.error("Error al subir documentos:", error);
        res.status(500).json({ mensaje: "Error interno al guardar los archivos", error: error.message });
    }
};

const obtenerDocumentos = async (req, res) => {
    try {
        const { id } = req.params; // Este es el expediente_id
        const documentos = await Documento.obtenerPorExpediente(id);
        res.status(200).json(documentos);
    } catch (error) {
        console.error("Error al obtener documentos:", error);
        res.status(500).json({ mensaje: "Error al cargar archivos", error: error.message });
    }
};

module.exports = {
    subirDocumentos,
    obtenerDocumentos
};