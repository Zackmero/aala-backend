const db = require("../config/db");

const Expediente = {
  // 1. CREAR (C - Create)
  crear: async (datos) => {
    const fechaHoy = new Date().toISOString().split("T")[0];

    // A. Insertamos los datos SIN el título
    const queryInsert = `
            INSERT INTO expedientes 
            (cliente_id, abogado_id, numero_expediente_judicial, materia_id, asunto_id, estatus_id, descripcion, fecha_apertura, prioridad, creado_por, actualizado_por, actualizado_en, fecha_cierre_esperada, fecha_cierre) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const [resultado] = await db.query(queryInsert, [
      datos.cliente_id,
      datos.abogado_id,
      datos.numero_expediente_judicial || null,
      datos.materia_id,
      datos.asunto_id,
      datos.estatus_id,
      datos.descripcion,
      fechaHoy,
      datos.prioridad || "Media",
      datos.creado_por,
      datos.actualizado_por,
      datos.actualizado_en,
      datos.fecha_cierre_esperada,
      datos.fecha_cierre || null,
    ]);

    const nuevoId = resultado.insertId;

    // B. AUTOGENERAR TÍTULO: Hacemos el Update rapidísimo
    const tituloGenerado = `Expediente #${nuevoId}`;
    const queryUpdate = `UPDATE expedientes SET titulo = ? WHERE id = ?`;
    await db.query(queryUpdate, [tituloGenerado, nuevoId]);

    return { id: nuevoId, titulo: tituloGenerado };
  },

  // 2. LEER TODOS (R - Read)
  obtenerTodos: async () => {
    const query = `
            SELECT 
                e.id, 
                e.titulo, 
                e.numero_expediente_judicial, 
                cli.nombre_completo AS cliente,  
                m.nombre AS materia, 
                a.nombre AS asunto, 
                est.nombre AS estatus,
                e.fecha_apertura,
                e.prioridad
            FROM expedientes e
            JOIN clientes cli ON e.cliente_id = cli.id
            JOIN catalogo_materias m ON e.materia_id = m.id
            JOIN catalogo_asuntos a ON e.asunto_id = a.id
            JOIN catalogo_estatus est ON e.estatus_id = est.id
            ORDER BY e.id DESC
        `;
    const [filas] = await db.query(query);
    return filas;
  },

  // 3. LEER UNO SOLO (Para ver los detalles del expediente)
  obtenerPorId: async (id) => {
    const query = `SELECT * FROM expedientes WHERE id = ?`;
    const [filas] = await db.query(query, [id]);
    return filas[0];
  },

  // 4. ACTUALIZAR (U - Update) - (Ej: Cuando cambia de estatus o añaden el # judicial)
  actualizar: async (id, datos) => {
    const query = `
            UPDATE expedientes 
            SET estatus_id = ?, numero_expediente_judicial = ?, descripcion = ?, actualizado_por = ?
            WHERE id = ?
        `;
    await db.query(query, [
      datos.estatus_id,
      datos.numero_expediente_judicial,
      datos.descripcion,
      datos.actualizado_por,
      id,
    ]);
    return true;
  },

  // Función de Bitácora (El rastro de auditoría)
  registrarEnBitacora: async (usuario_id, expediente_id, descripcion) => {
    const query = `
            INSERT INTO bitacora_actividad 
            (usuario_id, accion, modulo, expediente_id, descripcion) 
            VALUES (?, 'CREACION', 'EXPEDIENTES', ?, ?)
        `;
    await db.query(query, [usuario_id, expediente_id, descripcion]);
  },
};

module.exports = Expediente;
