const db = require('../config/db');

const Pago = {
    // 1. Guardar un nuevo registro de cobro/pago
    crear: async (datos) => {
        const query = `
            INSERT INTO pagos 
            (expediente_id, concepto, tipo_cobro, monto, fecha_vencimiento, estatus, notas, registrado_por) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [resultado] = await db.query(query, [
            datos.expediente_id,
            datos.concepto,
            datos.tipo, 
            datos.monto,
            datos.fecha_vencimiento,
            datos.estatus || 'Pendiente',
            datos.notas || null,
            datos.registrado_por
        ]);
        
        return resultado.insertId;
    },

    // 2. Traer todos los pagos de un expediente
    obtenerPorExpediente: async (expediente_id) => {
        // Renombramos tipo_cobro a tipo usando 'AS' para que Vue lo lea automáticamente
        const query = `
            SELECT 
                id, 
                concepto, 
                tipo_cobro AS tipo, 
                monto, 
                fecha_vencimiento, 
                estatus,
                fecha_pago,
                metodo_pago,
                notas,
                comprobante_url
            FROM pagos 
            WHERE expediente_id = ? 
            ORDER BY fecha_vencimiento ASC
        `;
        const [filas] = await db.query(query, [expediente_id]);
        return filas;
    },

    // 3. Actualizar el estatus de un pago (por ejemplo, marcarlo como pagado)
    actualizar: async (id, datos) => {
        const query = `
            UPDATE pagos SET 
                concepto = ?, tipo_cobro = ?, monto = ?, fecha_vencimiento = ?,
                estatus = ?, metodo_pago = ?, fecha_pago = ?, notas = ?
                ${datos.comprobante_url ? ', comprobante_url = ?' : ''}
            WHERE id = ?
        `;

        const parametros = [
            datos.concepto, datos.tipo, datos.monto, datos.fecha_vencimiento,
            datos.estatus, datos.metodo_pago || null, datos.fecha_pago || null, datos.notas || null
        ];

        if (datos.comprobante_url) {
            parametros.push(datos.comprobante_url);
        }

        parametros.push(id);

        const [resultado] = await db.query(query, parametros);
        return resultado.affectedRows;
    },

        // 4. Eliminar un pago
    eliminar: async (id) => {
        const query = `DELETE FROM pagos WHERE id = ?`;
        const [resultado] = await db.query(query, [id]);
        return resultado.affectedRows;
    }
};

module.exports = Pago;