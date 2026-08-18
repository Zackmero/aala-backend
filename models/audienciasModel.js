const db = require('../config/db');

const Audiencia = {
    obtenerTodos: async () => {
        const query = ` SELECT au.*,
                            e.id AS expediente_id,
                            ab.nombre AS nombre_abogado,
                            e.numero_expediente_judicial AS numero_expediente,
                            c.nombre_completo AS nombre_cliente
                            FROM audiencias au
                            left join expedientes e on au.expediente_id = e.id
                            left join clientes c on e.cliente_id = c.id
                            left join abogados ab on au.abogado_id = ab.usuario_id
                            ORDER BY au.fecha_hora DESC

        `;
        
        const [filas] = await db.query(query);
        return filas;
    },

    obtenerPorExpedienteId: async (id) => {
        const query = `
          SELECT 
            au.id,
            au.titulo,
            au.lugar,
            au.estatus,
            au.notas_preparacion,
            au.resultado,
            au.abogado_id,
            au.fecha_hora,
            au.fecha_creacion,
            e.id AS expediente_id,
            ab.nombre AS nombre_abogado,
            e.numero_expediente_judicial AS numero_expediente,
            c.nombre_completo AS nombre_cliente
        FROM audiencias au
        LEFT JOIN expedientes e ON au.expediente_id = e.id
        LEFT JOIN clientes c ON e.cliente_id = c.id
        LEFT JOIN abogados ab ON au.abogado_id = ab.usuario_id
        WHERE e.id = ?
        ORDER BY au.fecha_hora DESC
        `;
        const [filas] = await db.query(query, [id]);
        return filas;
    },

    crear: async (datos) => {
        const query = `
            INSERT INTO audiencias 
            (expediente_id, titulo, fecha_hora, lugar, estatus, abogado_id, notas_preparacion, resultado, fecha_creacion)
            VALUES (?,?,?,?,?,?,?,?,?)
        `;

        const [resultado] = await db.query(query, [
            datos.expediente_id,
            datos.titulo,
            datos.fecha_hora,
            datos.lugar,
            datos.estatus,
            datos.abogado_id,
            datos.notas_preparacion,
            datos.resultado,
            datos.fecha_creacion
        ]);

        return resultado.insertId;
    },

    actualizar: async (id, datos) => {
        const query = `
            UPDATE audiencias 
            SET expediente_id = ?, abogado_id = ?, fecha_hora = ?, titulo = ?, lugar = ?, estatus = ?, notas_preparacion = ?, resultado = ?, fecha_creacion = ?
            WHERE id = ?
        `;
        const [resultado] = await db.query(query, [
            datos.expediente_id,
            datos.abogado_id,
            datos.fecha_hora,
            datos.titulo || null,
            datos.lugar,
            datos.estatus,
            datos.notas_preparacion,
            datos.resultado,
            datos.fecha_creacion,
            id
        ]);
        return resultado.affectedRows > 0;
    },

    eliminar: async (id) => {
        const query = `DELETE FROM audiencias WHERE id = ?`;
        const [resultado] = await db.query(query, [id]);
        return resultado.affectedRows > 0;
    }
}

module.exports = Audiencia;