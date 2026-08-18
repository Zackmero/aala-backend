const db = require('../config/db');

const Pago = {
    // 1. Guardar un nuevo registro de cobro/pago
    crear: async (datos) => {
        let query = '';

         // Preparamos los parámetros básicos siempre presentes
        const parametrosComprobante = [
            datos.expediente_id,
            datos.concepto,
            datos.tipo_cobro, 
            datos.monto,
            datos.fecha_vencimiento,
            datos.fecha_pago, 
            datos.metodo_pago,
            datos.estatus || 'Pendiente',
            datos.notas || null,
            datos.registrado_por,
            datos.comprobante_url,
        ];

        const parametrosSinComprobante = [
            datos.expediente_id,
            datos.concepto,
            datos.tipo_cobro, // Asegúrate de que desde Vue mandas "tipo" o cámbialo a "tipo_cobro" si así viene
            datos.monto,
            datos.fecha_vencimiento,
            datos.estatus || 'Pendiente',
            datos.notas || null,
            datos.registrado_por,
        ];


        // Verificamos si en el controlador le asignamos la URL de AWS
        if (datos.comprobante_url) {
            query = `
                INSERT INTO pagos 
                (expediente_id, concepto, tipo_cobro, monto, fecha_vencimiento, fecha_pago, metodo_pago, estatus, notas, registrado_por, comprobante_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
        } else {
            query = `
                INSERT INTO pagos 
                (expediente_id, concepto, tipo_cobro, monto, fecha_vencimiento, estatus, notas, registrado_por) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
        }
        if (datos.comprobante_url) {
            const [resultado] = await db.query(query, parametrosComprobante);
            return resultado.insertId;
        }else {
            const [resultado] = await db.query(query, parametrosSinComprobante);
            return resultado.insertId;
        }
    
    },

    // 2. Traer todos los pagos de un expediente
    obtenerPorExpediente: async (expediente_id) => {
        // Renombramos tipo_cobro a tipo usando 'AS' para que Vue lo lea automáticamente
        const query = `
            SELECT 
                p.*,
                p.tipo_cobro AS tipo,
                a.nombre AS nombre_abogado
            FROM pagos p
            LEFT JOIN abogados a ON p.registrado_por = a.usuario_id
            WHERE expediente_id = ? 
            ORDER BY fecha_vencimiento ASC
            
        `;
        const [filas] = await db.query(query, [expediente_id]);
        return filas;
    },

     obtenerPorId: async (id) => {
        const query = `
            SELECT 
                p.*,
                p.tipo_cobro AS tipo,
                a.nombre AS nombre_abogado
            FROM pagos p
            LEFT JOIN abogados a ON p.registrado_por = a.usuario_id
            WHERE p.id = ? 
            ORDER BY fecha_vencimiento ASC
        `;
        const [filas] = await db.query(query, [id]);
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
            datos.concepto, datos.tipo_cobro, datos.monto, datos.fecha_vencimiento,
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
    },

        // 5. Obtener todos los pagos (para el dashboard o lista general)
    obtenerListaPagos: async () => {
        const query = `
        SELECT 
            p.id,
            p.concepto,
            p.tipo_cobro AS tipo,
            p.monto,
            p.fecha_vencimiento,
            p.estatus,
            p.fecha_pago,
            p.metodo_pago,
            p.notas,
            p.comprobante_url,
            e.id AS expediente_id,
            a.nombre AS nombre_abogado,
            e.numero_expediente_judicial AS numero_expediente,
            c.nombre_completo AS nombre_cliente
        FROM pagos p
        LEFT JOIN expedientes e ON p.expediente_id = e.id
        LEFT JOIN clientes c ON e.cliente_id = c.id
        LEFT JOIN abogados a ON p.registrado_por = a.usuario_id
        ORDER BY p.fecha_vencimiento DESC
        `;
        const [filas] = await db.query(query);
        return filas;
    },

    obtenerTotalPagos: async () => {
        const query = `SELECT SUM(monto) AS total FROM pagos`;
        const [filas] = await db.query(query);
        return filas[0].total;
    },
};

module.exports = Pago;