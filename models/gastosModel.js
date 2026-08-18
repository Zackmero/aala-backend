const db = require("../config/db");

const Gasto = {
  obtenerPorExpediente: async (expediente_id) => {
    const query = `
            SELECT 
                g.*,
                a.nombre AS abogado
            FROM gastos g
            LEFT JOIN abogados a ON g.abogado_id = a.id 
            WHERE g.expediente_id = ?
            ORDER BY g.fecha_gasto DESC;
        `;
    const [filas] = await db.query(query, [expediente_id]);
    return filas;
  },

  obtenerTodos: async () => {
    const query = `
            SELECT g.*, ab.nombre AS abogado 
            FROM gastos g
            LEFT JOIN abogados ab ON g.abogado_id = ab.id
            ORDER BY g.fecha_gasto DESC
        `;
    const [filas] = await db.query(query);
    return filas;
  },

  obtenerPorId: async (id) => {
    const [filas] = await db.query("SELECT * FROM gastos WHERE id = ?", [id]);
    return filas[0];
  },

  crear: async (datos) => {
    let query = "";

    // Verificamos si en el controlador le asignamos la URL de AWS
    if (datos.comprobante_url) {
      query = `
        INSERT INTO gastos 
            (expediente_id, abogado_id, registrado_por, concepto, categoria, monto, fecha_gasto, notas, comprobante_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    } else {
      query = `
        INSERT INTO gastos 
            (expediente_id, abogado_id, registrado_por, concepto, categoria, monto, fecha_gasto, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    }

    const paramsConComprobante = [
      datos.expediente_id || null, // Si no hay expediente, es gasto general
      datos.abogado_id || null,
      datos.registrado_por, // Este viene seguro del servidor
      datos.concepto,
      datos.categoria,
      datos.monto,
      datos.fecha_gasto,
      datos.notas && datos.notas.trim() !== "" ? datos.notas : null,
      datos.comprobante_url,
    ];

    const paramsSinComprobante = [
      datos.expediente_id || null, // Si no hay expediente, es gasto general
      datos.abogado_id || null,
      datos.registrado_por, // Este viene seguro del servidor
      datos.concepto,
      datos.categoria,
      datos.monto,
      datos.fecha_gasto,
      datos.notas && datos.notas.trim() !== "" ? datos.notas : null,
      datos.comprobante_url,
    ];

    if (datos.comprobante_url) {
      const [resultado] = await db.query(query, paramsConComprobante);
      return resultado.insertId;
    } else {
      const [resultado] = await db.query(query, paramsSinComprobante);
      return resultado.insertId;
    }
  },

  actualizar: async (id, datos) => {
    let query = `
            UPDATE gastos SET 
                expediente_id = ?,
                abogado_id = ?,
                categoria = ?,
                concepto = ?,
                monto = ?,
                estatus = ?,
                fecha_gasto = ?,
                notas = ?
                ${datos.comprobante_url ? ", comprobante_url = ?" : ""}
            WHERE id = ?
        `;

    const params = [
      datos.expediente_id,
      datos.abogado_id,
      datos.categoria,
      datos.concepto,
      datos.monto,
      datos.estatus,
      datos.fecha_gasto,
      datos.notas || null,
    ];

    if (datos.comprobante_url) {
      params.push(datos.comprobante_url);
    }

    params.push(id);

    const [resultado] = await db.query(query, params);
    return resultado.affectedRows;
  },

  eliminar: async (id) => {
    console.log("Eliminando gasto con ID:", id);
    const [resultado] = await db.query("DELETE FROM gastos WHERE id = ?", [id]);
    return resultado.affectedRows;
  },
};

module.exports = Gasto;
