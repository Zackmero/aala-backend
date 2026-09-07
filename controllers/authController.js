const Usuario = require('../models/usuariosModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscamos solo en la tabla maestra de usuarios
        const usuario = await Usuario.buscarPorEmail(email);

        if (usuario && usuario.password === password) {
            // Creamos el token con el ID y el ROL
            // es_socio viaja FIRMADO dentro del token: el navegador no lo puede alterar.
            const esSocio = Number(usuario.es_socio) === 1 ? 1 : 0;

            const token = jwt.sign(
                { id: usuario.id, rol: usuario.rol, es_socio: esSocio }, 
                process.env.JWT_SECRET, 
                { expiresIn: '8h' }
            );

            return res.json({ 
                id: usuario.id,
                token, 
                rol: usuario.rol, 
                es_socio: esSocio,
                nombre: usuario.nombre_real 
            });
        }

        res.status(401).json({ mensaje: 'Credenciales inválidas' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { login };