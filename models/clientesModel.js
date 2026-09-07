// Importamos la conexión a la base de datos
const db = require('../config/db');

// El objeto Cliente contendrá toda la lógica de base de datos
const Cliente = {
    // Obtener todos los registros
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM clientes ORDER BY id asc');
        return rows;
    },

    // Crear un nuevo registro
    create: async (datos, connection) => {
      const query = `
            INSERT INTO clientes 
            (usuario_id, nombre_completo, rfc, curp, telefono, email, direccion, estado_civil) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            datos.usuario_id, 
            datos.nombre_completo, 
            datos.rfc || null, 
            datos.curp || null, 
            datos.telefono || null, 
            datos.email || null,
            datos.direccion || null, 
            datos.estado_civil
        ];
        
        return await connection.query(query, params);
    },

    // Actualizar un registro existente
    // Acepta una conexion para poder ir dentro de una transaccion junto con
    // la actualizacion del correo de acceso en `usuarios`.
    update: async (id, data, conexion = db) => {
        const { nombre_completo, rfc, curp, telefono, email, direccion, estado_civil } = data;
        const query = 'UPDATE clientes SET nombre_completo=?, rfc=?, curp=?, telefono=?, email=?, direccion=?, estado_civil=? WHERE id=?';
        const [result] = await conexion.query(query, [
            nombre_completo,
            rfc || null,
            curp || null,
            telefono || null,
            email || null,
            direccion || null,
            estado_civil,
            id,
        ]);
        return result;
    },

    // Eliminar un registro
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM clientes WHERE id = ?', [id]);
        return result;
    }
};

module.exports = Cliente;