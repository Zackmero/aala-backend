const db = require('../config/db');

const Pago = {
    // 1. Guardar un nuevo registro de cobro/pago
    crear: async (datos) => {
        // Antes habia dos consultas casi iguales y la de "sin comprobante"
        // omitia fecha_pago y metodo_pago: un cobro registrado como Pagado en
        // efectivo, sin comprobante, quedaba Pagado pero SIN fecha ni metodo.
        // Y fecha_pago es justo el campo con el que se calculan los ingresos
        // del mes, asi que esos cobros no aparecian en ningun corte.
        const columnas = [];
        const valores = [];

        const agregar = (columna, valor) => {
            columnas.push(columna);
            valores.push(valor);
        };

        agregar('expediente_id', datos.expediente_id);
        agregar('concepto', datos.concepto);
        agregar('tipo_cobro', datos.tipo_cobro);
        agregar('monto', datos.monto);
        agregar('fecha_vencimiento', datos.fecha_vencimiento);
        agregar('estatus', datos.estatus || 'Pendiente');
        agregar('notas', datos.notas || null);
        agregar('registrado_por', datos.registrado_por);

        // Estos tres solo se escriben si vienen, sin importar si hay archivo.
        if (datos.fecha_pago) agregar('fecha_pago', datos.fecha_pago);
        if (datos.metodo_pago) agregar('metodo_pago', datos.metodo_pago);
        if (datos.comprobante_url) agregar('comprobante_url', datos.comprobante_url);

        const marcadores = columnas.map(() => '?').join(', ');
        const query = `INSERT INTO pagos (${columnas.join(', ')}) VALUES (${marcadores})`;

        const [resultado] = await db.query(query, valores);
        return resultado.insertId;
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