const db = require("../config/db");

const Usuario = {
  buscarPorEmail: async (email) => {
    const query = `
                SELECT u.*, 
                   COALESCE(a.nombre, c.nombre_completo) as nombre_real
            FROM usuarios u
            LEFT JOIN abogados a ON u.id = a.usuario_id
            LEFT JOIN clientes c ON u.id = c.usuario_id
            WHERE u.email = ?
            `;
    const [rows] = await db.query(query, [email]);
    return rows[0];
  },
  // Para cuando el abogado registre a un nuevo cliente y le cree su acceso
  crear: async (datos, connection) => {
    const query =
      "INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)";
    const [result] = await connection.query(query, [
      datos.email,
      datos.password,
      datos.rol,
    ]);
    return result.insertId;
  },
};

module.exports = Usuario;
