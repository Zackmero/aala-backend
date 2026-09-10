// Importamos la conexión a la base de datos
const db = require("../config/db");
const { hoyMexico, ahoraMexico } = require("../utils/fechas");

// `catalogo_estatus` puede o no tener una columna que marque los estatus de
// cierre. Se comprueba una sola vez. Si no existe, se cae a "expediente sin
// fecha de cierre = activo", que es lo unico deducible sin esa marca.
let cacheEstatusFinal = null;
const tieneColumnaEsFinal = async () => {
  if (cacheEstatusFinal !== null) return cacheEstatusFinal;
  try {
    const [filas] = await db.query("SHOW COLUMNS FROM catalogo_estatus LIKE 'es_final'");
    cacheEstatusFinal = filas.length > 0;
  } catch (error) {
    cacheEstatusFinal = false;
  }
  return cacheEstatusFinal;
};

// El objeto Dashboard contendrá toda la lógica de base de datos
const Dashboard = {

  // Las cuatro cifras de las tarjetas, calculadas en SQL con sus filtros
  // reales. Antes se pedian las listas completas y se contaba en el navegador:
  // "casos activos" incluia los cerrados, "audiencias (7 dias)" eran todas las
  // de la historia, e "ingresos del mes" era SUM(monto) de TODOS los cobros,
  // incluidos los que nadie habia pagado.
  obtenerResumen: async () => {
    const [[{ clientes }]] = await db.query(
      'SELECT COUNT(*) AS clientes FROM clientes'
    );

    // Casos activos
    let casos = 0;
    if (await tieneColumnaEsFinal()) {
      const [[fila]] = await db.query(`
        SELECT COUNT(*) AS casos
        FROM expedientes e
        LEFT JOIN catalogo_estatus est ON e.estatus_id = est.id
        WHERE COALESCE(est.es_final, 0) = 0
          AND e.fecha_cierre IS NULL
      `);
      casos = fila.casos;
    } else {
      const [[fila]] = await db.query(
        'SELECT COUNT(*) AS casos FROM expedientes WHERE fecha_cierre IS NULL'
      );
      casos = fila.casos;
    }

    // Audiencias programadas dentro de los proximos 7 dias.
    // Se pasa la hora "ahora" de México calculada en Node en vez de usar
    // NOW() de MySQL, que corre en el timezone del servidor de base de
    // datos (normalmente UTC) y no coincide con la hora local guardada en
    // fecha_hora.
    const ahora = ahoraMexico();
    const [[{ audiencias }]] = await db.query(
      `
      SELECT COUNT(*) AS audiencias
      FROM audiencias
      WHERE estatus = 'Programada'
        AND fecha_hora >= ?
        AND fecha_hora < DATE_ADD(?, INTERVAL 7 DAY)
    `,
      [ahora, ahora]
    );

    // Ingresos del mes = lo efectivamente COBRADO en el mes en curso.
    // Se usa fecha_pago, no fecha_vencimiento: importa cuando entro el dinero.
    const [anioHoy, mesHoy] = hoyMexico().split("-");
    const [[{ ingresos }]] = await db.query(
      `
      SELECT COALESCE(SUM(monto), 0) AS ingresos
      FROM pagos
      WHERE estatus = 'Pagado'
        AND fecha_pago IS NOT NULL
        AND YEAR(fecha_pago) = ?
        AND MONTH(fecha_pago) = ?
    `,
      [anioHoy, mesHoy]
    );

    // Extra util para cobranza: lo vencido y sin pagar.
    const [[{ porCobrar }]] = await db.query(
      `
      SELECT COALESCE(SUM(monto), 0) AS porCobrar
      FROM pagos
      WHERE estatus = 'Pendiente'
        AND fecha_vencimiento < ?
    `,
      [hoyMexico()]
    );

    return {
      clientes: Number(clientes) || 0,
      casos: Number(casos) || 0,
      audiencias: Number(audiencias) || 0,
      ingresos: Number(ingresos) || 0,
      vencidoPorCobrar: Number(porCobrar) || 0,
    };
  },
  // Obtener todos los registros
  obtenerProximosVencimientos: async () => {
    try {
      const hoy = hoyMexico();
      const queryAudiencias = `
                SELECT
                    a.id,
                    a.titulo as descripcion,
                    a.fecha_hora as fecha,
                    'Audiencia' as tipo,
                    e.numero_expediente_judicial as identificador,
                    e.prioridad as prioridad
                FROM audiencias a
                LEFT JOIN expedientes e ON a.expediente_id = e.id
                WHERE a.estatus = 'Programada' AND a.fecha_hora >= ?
                ORDER BY a.fecha_hora ASC
                LIMIT 5
            `;
      const [audiencias] = await db.query(queryAudiencias, [hoy]);

      const queryPagos = `
                SELECT
                    p.id,
                    p.concepto as descripcion,
                    p.fecha_vencimiento as fecha,
                    'Cobro' as tipo,
                    e.numero_expediente_judicial as identificador,
                    e.prioridad as prioridad
                FROM pagos p
                LEFT JOIN expedientes e ON p.expediente_id = e.id
                WHERE p.estatus = 'Pendiente' AND p.fecha_vencimiento >= ?
                ORDER BY p.fecha_vencimiento ASC
                LIMIT 5
            `;


      const [pagos] = await db.query(queryPagos, [hoy]);
      // Con dateStrings, `fecha` llega como texto plano ("YYYY-MM-DD" o
      // "YYYY-MM-DD HH:MM:SS"); se normaliza el separador para que ambos
      // formatos se interpreten igual (como hora local) al comparar.
      const aInstante = (fecha) => new Date(String(fecha).replace(" ", "T")).getTime();
      const vencimientos = [...audiencias, ...pagos]
        .sort((a, b) => aInstante(a.fecha) - aInstante(b.fecha))
        .slice(0, 5);

    
      return vencimientos;
    } catch (error) {
      console.error("Error al obtener los próximos vencimientos:", error);
      throw new Error("Error al obtener los próximos vencimientos");
    }
  },
};

module.exports = Dashboard;
