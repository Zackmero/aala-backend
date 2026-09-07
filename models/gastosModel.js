const db = require("../config/db");

// La tabla `gastos` puede o no tener la columna metodo_pago segun cuando se
// creo la base. Se comprueba una sola vez y se recuerda, para no romper el
// alta de gastos si todavia no existe. Si la agregas
// (ALTER TABLE gastos ADD COLUMN metodo_pago VARCHAR(50) NULL), empieza a
// guardarse sola al reiniciar el servidor.
let cacheMetodoPago = null;
const tieneColumnaMetodoPago = async () => {
  if (cacheMetodoPago !== null) return cacheMetodoPago;
  try {
    const [filas] = await db.query("SHOW COLUMNS FROM gastos LIKE 'metodo_pago'");
    cacheMetodoPago = filas.length > 0;
  } catch (error) {
    cacheMetodoPago = false;
  }
  return cacheMetodoPago;
};

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
            SELECT 
                g.*, 
                ab.nombre AS abogado,
                e.numero_expediente_judicial AS numero_expediente,
                c.nombre_completo AS nombre_cliente
            FROM gastos g
            LEFT JOIN abogados ab ON g.abogado_id = ab.id
            LEFT JOIN expedientes e ON g.expediente_id = e.id
            LEFT JOIN clientes c ON e.cliente_id = c.id
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
    // Se arma el INSERT con las columnas que realmente vienen, en vez de
    // mantener dos consultas casi identicas. Las dos anteriores OMITIAN
    // `estatus`, asi que todo gasto nuevo caia al DEFAULT 'Pendiente'
    // aunque el abogado lo hubiera marcado como Pagado.
    const columnas = [];
    const valores = [];

    const agregar = (columna, valor) => {
      columnas.push(columna);
      valores.push(valor);
    };

    agregar("expediente_id", datos.expediente_id || null); // sin expediente = gasto general del despacho
    agregar("abogado_id", datos.abogado_id || null);
    agregar("registrado_por", datos.registrado_por); // este viene del token, no del navegador
    agregar("concepto", datos.concepto);
    agregar("categoria", datos.categoria);
    agregar("monto", datos.monto);
    agregar("fecha_gasto", datos.fecha_gasto);
    agregar("notas", datos.notas && datos.notas.trim() !== "" ? datos.notas : null);
    agregar("estatus", datos.estatus || "Pendiente");

    if (datos.comprobante_url) agregar("comprobante_url", datos.comprobante_url);

    // El formulario pide metodo de pago cuando el gasto va como Pagado, pero
    // no se guardaba en ningun lado. Solo se incluye si la tabla tiene la
    // columna: asi no rompe nada si todavia no existe (ver tieneMetodoPago).
    if (datos.metodo_pago && (await tieneColumnaMetodoPago())) {
      agregar("metodo_pago", datos.metodo_pago);
    }

    const marcadores = columnas.map(() => "?").join(", ");
    const query = `INSERT INTO gastos (${columnas.join(", ")}) VALUES (${marcadores})`;

    const [resultado] = await db.query(query, valores);
    return resultado.insertId;
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

    // Mismo caso que en crear: solo si la columna existe.
    if (datos.metodo_pago && (await tieneColumnaMetodoPago())) {
      query = query.replace("WHERE id = ?", ", metodo_pago = ? WHERE id = ?");
      params.push(datos.metodo_pago);
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
