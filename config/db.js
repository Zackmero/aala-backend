// Importamos el modulo mysql2 con soporte para promesas (para usar async/await facilmente)
const mysql = require('mysql2/promise');
require('dotenv').config();

// Creamos un "pool" de conexiones. Esto es mas eficiente que una sola conexion
// porque permite que el despacho haga multiples peticiones simultaneas a SiteGround
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportamos esta conexion para poder usarla en nuestros controladores y modelos mas adelante
module.exports = pool;