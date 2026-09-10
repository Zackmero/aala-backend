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
    queueLimit: 0,
    // Sin esto, mysql2 devuelve DATE/DATETIME como objetos Date de JS,
    // interpretados en la zona horaria del proceso de Node (UTC en Render).
    // Al serializarse con res.json() se les pega una 'Z' (toISOString) y el
    // frontend los reinterpreta como UTC real, desfasando horas/fechas según
    // la hora del día. Con dateStrings devolvemos el valor tal cual está en
    // la base de datos ("YYYY-MM-DD HH:MM:SS"), sin ninguna conversión de
    // zona horaria — el sistema entero trabaja con hora local de México como
    // texto plano, de extremo a extremo.
    dateStrings: true
});

// Exportamos esta conexion para poder usarla en nuestros controladores y modelos mas adelante
module.exports = pool;