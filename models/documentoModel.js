// models/documentoModel.js
const db = require('../config/db');

const Documento = {
    // Recibe un arreglo de arreglos con los datos de todos los archivos
    crearMultiples: async (datosArchivos) => {
        // datosArchivos se verá así: [ [exp_id, nombre1, ruta1...], [exp_id, nombre2, ruta2...] ]
        const query = `
        INSERT INTO documentos 
        (expediente_id, nombre_original, nombre_sistema, ruta_url, tipo_documento, notas, subido_por) 
        VALUES ?
    `;
        // Al pasar [datosArchivos], mysql2 entiende que debe insertar múltiples filas
        const [resultado] = await db.query(query, [datosArchivos]);
        return resultado.affectedRows; // Retorna cuántos archivos se guardaron
    },

    // Obtener todos los documentos de un expediente específico
    obtenerPorExpediente: async (expediente_id) => {
        const query = `
            SELECT 
                *
            FROM documentos 
            WHERE expediente_id = ? 
            ORDER BY creado_en DESC
        `;
        const [filas] = await db.query(query, [expediente_id]);
        return filas;
    },
    obtenerDocumentoPorId:  async (expediente_id) => {
        const query = `
            SELECT 
                *
            FROM documentos 
            WHERE id = ? 
            ORDER BY creado_en DESC
        `;
        const [filas] = await db.query(query, [expediente_id]);
        return filas[0];
    },

  

    eliminar: async (documento_id) => {
        const query = `DELETE FROM documentos WHERE id = ?`;
        const [resultado] = await db.query(query, [documento_id]);
        return resultado.affectedRows; 
    }
};

module.exports = Documento;