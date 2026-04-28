// Importamos el Modelo que acabamos de crear
const Catalogos = require('../models/catalogoModel');


// Lógica para obtener catalogos
const obtenerCatalogos = async (req, res) => {
    try {
        const catalogos = await Catalogos.getAll();
        res.json(catalogos);
    } catch (error) {
        console.error('Error al obtener catalogos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


module.exports = {
    obtenerCatalogos,
};