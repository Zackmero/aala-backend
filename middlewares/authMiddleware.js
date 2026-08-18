// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Buscamos el token en las cabeceras de la petición
    const tokenHeader = req.header('Authorization');
    
    if (!tokenHeader) {
        return res.status(401).json({ mensaje: "Acceso denegado. No hay token de autenticación." });
    }

    try {
        // Normalmente el token llega como "Bearer eyJhbGciOi..." por lo que quitamos la palabra Bearer
        const tokenLimpio = tokenHeader.replace('Bearer ', '');
        
        // Desencriptamos el token. 
        // Nota: Asegúrate de usar la misma clave secreta con la que generas el token en tu Login
        const decodificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET || 'tu_clave_secreta_aqui');
        
        // Guardamos los datos del usuario en la petición (request) para que el controlador los use
        req.usuario = decodificado; 
        
        next(); // El token es válido, dejamos pasar la petición
    } catch (error) {
        return res.status(401).json({ mensaje: "Token inválido o expirado." });
    }
};

module.exports = verificarToken;