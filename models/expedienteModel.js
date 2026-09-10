const db = require("../config/db");
const { hoyMexico } = require("../utils/fechas");

const Expediente = {
  // 1. CREAR (C - Create)
  crear: async (datos) => {
    const fechaHoy = hoyMexico();

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
                e.cliente_id,
                e.abogado_id,
                e.materia_id,
                e.asunto_id,
                e.estatus_id,
                e.descripcion,
                e.fecha_cierre_esperada,
                cli.nombre_completo AS cliente, 
                ab.nombre AS abogado, 
                m.nombre AS materia, 
                a.nombre AS asunto, 
                est.nombre AS estatus,
                e.fecha_apertura,
                e.prioridad
            FROM expedientes e
            LEFT JOIN clientes cli ON e.cliente_id = cli.id
            LEFT JOIN catalogo_materias m ON e.materia_id = m.id
            LEFT JOIN catalogo_asuntos a ON e.asunto_id = a.id
            LEFT JOIN catalogo_estatus est ON e.estatus_id = est.id
            LEFT JOIN abogados ab ON e.abogado_id = ab.id
            ORDER BY e.id DESC
        `;
    const [filas] = await db.query(query);
    return filas;
  },

  // 3. LEER UNO SOLO (Para ver los detalles del expediente)
  obtenerPorId: async (id) => {
    const query = `SELECT 
                      e.*,
                      cli.nombre_completo AS nombre_cliente
                    FROM expedientes e 
                    LEFT JOIN clientes cli 
                      ON e.cliente_id = cli.id 
                    WHERE e.id = ?`;
    const [filas] = await db.query(query, [id]);
    return filas[0];
  },

  // 4. ACTUALIZAR (U - Update) - (Ej: Cuando cambia de estatus o añaden el # judicial)
  actualizar: async (id, datos) => {
    // Solo se actualizan los campos que vienen en la peticion.
    // Un campo ausente NUNCA sobreescribe lo que ya esta guardado: asi
    // editar el estatus deja de borrar la descripcion del expediente.
    const camposPermitidos = [
      "estatus_id",
      "abogado_id",
      "numero_expediente_judicial",
      "descripcion",
      "prioridad",
      "fecha_cierre_esperada",
    ];

    const asignaciones = [];
    const valores = [];

    for (const campo of camposPermitidos) {
      const valor = datos[campo];
      if (valor === undefined || valor === null) continue;

      // La descripcion es informacion legal del caso. No se vacia por
      // accidente: si llega en blanco, se conserva la que ya existe.
      if (campo === "descripcion" && String(valor).trim() === "") continue;

      asignaciones.push(`${campo} = ?`);
      valores.push(valor);
    }

    // Si la peticion no traia ningun campo util, no tocamos la fila.
    if (asignaciones.length === 0) return false;

    asignaciones.push("actualizado_por = ?");
    valores.push(datos.actualizado_por ?? null);
    asignaciones.push("actualizado_en = NOW()");

    valores.push(id);

    const query = `UPDATE expedientes SET ${asignaciones.join(", ")} WHERE id = ?`;
    await db.query(query, valores);
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
