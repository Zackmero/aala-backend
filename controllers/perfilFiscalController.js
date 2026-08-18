const PerfilFiscal = require('../models/perfilFiscalModel');

const perfilFiscalController = {
    obtenerDirectorio: async (req, res) => {
        try {
            const perfiles = await PerfilFiscal.obtenerTodos();
            res.json(perfiles);
        } catch (error) {
            console.error("Error al obtener directorio fiscal:", error);
            res.status(500).json({ mensaje: "Error del servidor" });
        }
    },

    obtenerPerfil: async (req, res) => {
        try {
            const { cliente_id } = req.params;
            const perfil = await PerfilFiscal.obtenerPorClienteId(cliente_id);
            if (!perfil) {
                return res.status(404).json({ mensaje: "Perfil fiscal no encontrado" });
            }
            res.json(perfil);
        } catch (error) {
            res.status(500).json({ mensaje: "Error del servidor" });
        }
    },

    crearPerfil: async (req, res) => {
        try {
            // El req.body traerá los datos desde el formulario de Vue
            const nuevoId = await PerfilFiscal.crear(req.body);
            res.status(201).json({ 
                mensaje: "Perfil fiscal creado correctamente", 
                id: nuevoId 
            });
        } catch (error) {
            console.error("Error al crear perfil fiscal:", error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ mensaje: "Este cliente ya tiene un perfil fiscal o el RFC ya existe." });
            }
            res.status(500).json({ mensaje: "Error del servidor" });
        }
    },
    obtenerTramitesFiscales: async (req, res) => {
        try {
            const { perfil_id } = req.params;
            const tramites = await PerfilFiscal.obtenerPorPerfil(perfil_id);
            res.json(tramites);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },
    registrarTramiteFiscal: async (req, res) => {
        try {
            const id = await PerfilFiscal.crearTramiteFiscal(req.body);
            res.status(201).json({ id, mensaje: "Trámite registrado" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

};

module.exports = perfilFiscalController;