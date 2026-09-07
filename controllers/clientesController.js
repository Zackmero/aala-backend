// Importamos el Modelo que acabamos de crear
const Cliente = require('../models/clientesModel');
const Usuario = require('../models/usuariosModel');
const db = require('../config/db');

// Lógica para obtener clientes
const obtenerClientes = async (req, res) => {
    try {
        const clientes = await Cliente.getAll();
        res.status(200).json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// Quita acentos y caracteres no alfanuméricos para armar el email placeholder
const normalizarParaEmail = (texto) => {
    return texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

// La tabla usuarios exige email NOT NULL + UNIQUE (se usa para login),
// así que a los clientes sin email les generamos uno interno único.
const generarEmailPlaceholder = async (connection, nombreCompleto) => {
    const partes = nombreCompleto.trim().split(/\s+/);
    const inicial = normalizarParaEmail(partes[0]).charAt(0) || 'x';
    const apellido = normalizarParaEmail(partes.length >= 2 ? partes[1] : partes[0]) || 'cliente';
    const base = `${inicial}.${apellido}`;

    let sufijo = '';
    let contador = 1;
    let email;
    do {
        // .invalid esta reservado por el RFC 2606 justo para direcciones que
        // no deben existir: si algun dia conectas envio de correo, no rebotan raro.
        email = `${base}${sufijo}@sinemail.invalid`;
        const [rows] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) break;
        contador += 1;
        sufijo = String(contador);
    } while (true);

    return email;
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

        const emailUsuario = (email && email.trim() !== '')
            ? email
            : await generarEmailPlaceholder(connection, nombre_completo);

        // 1. Crear el usuario primero
        const usuarioId = await Usuario.crear({
            email: emailUsuario,
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
                usuario: emailUsuario,
                password: passwordGenerada,
                // Avisa al front que este correo es generado y el cliente
                // todavia no puede entrar a su portal.
                sin_email: emailUsuario.endsWith('@sinemail.invalid')
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
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const { id } = req.params;

        const [filas] = await connection.query(
            'SELECT usuario_id, email FROM clientes WHERE id = ?', [id]
        );
        const clienteActual = filas[0];

        if (!clienteActual) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        await Cliente.update(id, req.body, connection);

        // El correo de la ficha ES el usuario con el que el cliente entra al
        // portal. Antes solo se actualizaba en `clientes`, asi que cambiarlo
        // no servia de nada: el cliente seguia sin poder entrar. Se notaba
        // sobre todo con los correos generados @sinemail.invalid.
        const nuevoEmail = (req.body.email || '').trim();
        const cambioElCorreo = nuevoEmail && nuevoEmail !== (clienteActual.email || '');

        if (cambioElCorreo && clienteActual.usuario_id) {
            await connection.query(
                'UPDATE usuarios SET email = ? WHERE id = ?',
                [nuevoEmail, clienteActual.usuario_id]
            );
        }

        await connection.commit();

        res.json({
            mensaje: 'Cliente actualizado correctamente',
            accesoActualizado: Boolean(cambioElCorreo && clienteActual.usuario_id),
        });
    } catch (error) {
        await connection.rollback();

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                mensaje: 'Ese correo ya está registrado para otro usuario del sistema.'
            });
        }

        console.error('Error al actualizar:', error);
        res.status(500).json({ mensaje: 'Error al modificar el registro' });
    } finally {
        connection.release();
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