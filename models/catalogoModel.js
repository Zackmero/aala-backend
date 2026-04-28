// Importamos la conexión a la base de datos
const db = require('../config/db');


// El objeto Catalogo contendrá toda la lógica de base de datos
const Catalogo = {
    // Obtener todos los catalogos
    getCatalogoAsuntos: async () => {
        const [rows] = await db.query('SELECT * FROM catalogo_asuntos ORDER BY id DESC');
        return rows;
    },
    getCatalogoEstatus: async () => {
        const [rows] = await db.query('SELECT * FROM catalogo_estatus ORDER BY id DESC');
        return rows;
    },
    getCatalogoMaterias: async () => {
        const [rows] = await db.query('SELECT * FROM catalogo_materias ORDER BY id DESC');
        return rows;
    },
    getAll: async () => {
        const [asuntos] = await db.query('SELECT * FROM catalogo_asuntos ORDER BY id DESC');
        const [estatus] = await db.query('SELECT * FROM catalogo_estatus ORDER BY id DESC');
        const [materias] = await db.query('SELECT * FROM catalogo_materias ORDER BY id DESC');
        const [abogados] = await db.query('SELECT id, nombre FROM abogados WHERE nombre <> "Administrador" ORDER BY nombre ASC');
        return { asuntos, estatus, materias, abogados };
    }
};

module.exports = Catalogo;