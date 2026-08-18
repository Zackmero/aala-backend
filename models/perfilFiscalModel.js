const db = require('../config/db'); // Ajusta la ruta si tu archivo de conexión se llama distinto

const PerfilFiscal = {
    // 1. Obtener todos los clientes contables (Directorio Fiscal)
    obtenerTodos: async () => {
        const query = `
          SELECT 
                p.id, p.cliente_id, p.razon_social, p.rfc, p.regimen_fiscal, p.estatus_contable,
                c.nombre_completo AS nombre_cliente, c.email, c.telefono
            FROM perfiles_fiscales p
            JOIN clientes c 
            ON p.cliente_id = c.id
            ORDER BY c.nombre_completo ASC
        `;
        const [filas] = await db.query(query);
        return filas;
    },

    // 2. Obtener un perfil específico con todos sus datos
    obtenerPorClienteId: async (cliente_id) => {
        const query = `
            SELECT p.*, c.nombre_completo AS nombre_cliente, c.email, c.telefono 
            FROM perfiles_fiscales p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.cliente_id = ?
        `;
        const [filas] = await db.query(query, [cliente_id]);
        return filas[0];
    },

    // 3. Crear un nuevo perfil fiscal (Dar de alta en contabilidad a un cliente)
    crear: async (datos) => {
        const query = `
            INSERT INTO perfiles_fiscales 
            (cliente_id, razon_social, rfc, regimen_fiscal, actividad_economica, estatus_contable, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const params = [
            datos.cliente_id,
            datos.razon_social,
            datos.rfc,
            datos.regimen_fiscal,
            datos.actividad_economica,
            datos.estatus_contable || 'Activo'
        ];
        const [resultado] = await db.query(query, params);
        return resultado.insertId;
    },

    obtenerPorPerfil: async (perfil_id) => {    
        const [rows] = await db.query('SELECT * FROM tramites_fiscales WHERE perfil_fiscal_id = ?', [perfil_id]);
        return rows;
    },
    crearTramiteFiscal: async (datos) => {
        const query = `INSERT INTO tramites_fiscales (perfil_fiscal_id, tipo_tramite, periodo, estatus, resultado_estatus, observacion, fecha_vencimiento) VALUES (?,?,?,?,?,?,?)`;
        const [res] = await db.query(query, [datos.perfil_id, datos.tipo, datos.periodo, datos.estatus, datos.resultado, datos.observacion, datos.vencimiento]);
        return res.insertId;
    }

};

module.exports = PerfilFiscal;