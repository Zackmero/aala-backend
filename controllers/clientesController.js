// Importamos el Modelo que acabamos de crear
const Cliente = require('../models/clientesModel');
const Usuario = require('../models/usuariosModel');
const db = require('../config/db');

// Lógica para obtener clientes
const obtenerClientes = async (req, res) => {
    try {
        const clientes = await Cliente.getAll();
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// Lógica para crear un cliente
const crearCliente = async (req, res) => {
  const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { nombre_completo, rfc, curp, telefono, email, direccion, estado_civil } = req.body;

        const passwordGenerada = (curp && curp.length >= 10) 
            ? curp.substring(0, 10).toUpperCase() 
            : 'CLIENTE2026';

        // 1. Crear el usuario primero
        const usuarioId = await Usuario.crear({
            email: req.body.email,
            password: passwordGenerada,
            rol: 'cliente'
        }, connection);

        // 2. Crear el cliente ligado a ese usuario
        await Cliente.create({
            usuario_id: usuarioId,
            nombre_completo, rfc, curp, telefono, email, direccion, estado_civil
        }, connection);

        await connection.commit();
        res.status(201).json({ 
            mensaje: 'Cliente registrado con éxito',
            credenciales: {
                usuario: email,
                password: passwordGenerada
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar', error: error.message });
    } finally {
        connection.release();
    }
};

// Lógica para actualizar datos
const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await Cliente.update(id, req.body);
        res.json({ mensaje: 'Cliente actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ mensaje: 'Error al modificar el registro' });
    }
};

// Lógica para eliminar
const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await Cliente.delete(id);
        res.json({ mensaje: 'Cliente eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar:', error);
        res.status(500).json({ mensaje: 'Error al borrar el cliente' });
    }
};

module.exports = {
    obtenerClientes,
    crearCliente,
    actualizarCliente,
    eliminarCliente
};