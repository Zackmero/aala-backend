// Importamos la conexión a la base de datos
const db = require("../config/db");

// El objeto Dashboard contendrá toda la lógica de base de datos
const Dashboard = {
  // Obtener todos los registros
  obtenerProximosVencimientos: async () => {
    try {
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
                WHERE a.estatus = 'Programada' AND a.fecha_hora >= CURDATE()
                ORDER BY a.fecha_hora ASC 
                LIMIT 5
            `;
      const [audiencias] = await db.query(queryAudiencias);

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
                WHERE p.estatus = 'Pendiente' AND p.fecha_vencimiento >= CURDATE()
                ORDER BY p.fecha_vencimiento ASC 
                LIMIT 5
            `;


      const [pagos] = await db.query(queryPagos);
      const vencimientos = [...audiencias, ...pagos]
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5);

    
      return vencimientos;
    } catch (error) {
      console.error("Error al obtener los próximos vencimientos:", error);
      throw new Error("Error al obtener los próximos vencimientos");
    }
  },
};

module.exports = Dashboard;
