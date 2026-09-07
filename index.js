// Importamos las dependencias necesarias
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- VALIDACION DE ENTORNO ---
// Preferimos que el servidor no arranque a que arranque mal. Antes, si faltaba
// JWT_SECRET, se firmaba con una clave por defecto publica y nadie se enteraba.
const VARIABLES_REQUERIDAS = [
  'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET',
  'AWS_REGION', 'AWS_BUCKET_NAME', 'AWS_ACCESS_KEY', 'AWS_SECRET_KEY',
];
const variablesFaltantes = VARIABLES_REQUERIDAS.filter((v) => !process.env[v]);
if (variablesFaltantes.length > 0) {
  console.error('No se puede iniciar. Faltan variables de entorno: ' + variablesFaltantes.join(', '));
  process.exit(1);
}
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// IMPORTANTE: Cargamos los JSON primero para asegurar que existan
const clientesDocs = require('./docs/clientes.swagger.json');
const authDocs = require('./docs/auth.swagger.json');
const catalogosDocs = require('./docs/catalogos.swagger.json');
const expedienteDocs = require('./docs/expediente.swagger.json'); 
const documentosDocs = require('./docs/documentos.swagger.json');

const app = express();

// 1. Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API - AALA Despacho de Abogados",
      version: "1.0.0",
      description: "Documentación oficial de los endpoints del sistema legal.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Servidor Local" },
      { url: "https://aala-backend.onrender.com", description: "Producción" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    // UNIMOS LOS PATHS DE LOS JSON AQUÍ
    paths: {
      ...clientesDocs.paths,
      ...authDocs.paths,
      ...catalogosDocs.paths,
      ...expedienteDocs.paths,
      ...documentosDocs.paths
    },
    security: [{ bearerAuth: [] }],
  },
  // Dejamos apis vacío porque ya estamos cargando todo desde los JSON manuales
  apis: [], 
};

// Generamos la especificación
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// --- MIDDLEWARES ---
const origenesPermitidos = [
  'http://localhost:5173',
  'https://portal.aala.mx',
  'https://www.portal.aala.mx'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      // Lo recoge el manejador de errores del final y responde un 403 legible,
      // en lugar de un 500 con el stack de Node.
      const error = new Error('CORS_NO_PERMITIDO');
      error.origenRechazado = origin;
      callback(error);
    }
  }
}));

// Cabeceras de seguridad basicas: es lo que aporta helmet para una API JSON,
// sin sumar otra dependencia al proyecto.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

// Sin limite, un JSON gigante puede tumbar el proceso.
app.use(express.json({ limit: '1mb' }));

// --- LIMITE DE INTENTOS EN EL LOGIN ---
// En memoria a proposito: el servicio corre en una sola instancia, asi no hace
// falta ni una dependencia nueva ni Redis. Si algun dia escalas a varias
// instancias, esto tiene que moverse a un almacen compartido.
const INTENTOS_MAX = 8;
const VENTANA_MS = 15 * 60 * 1000;
const intentosPorIp = new Map();

app.use('/api/auth', (req, res, next) => {
  const ahora = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'desconocida';
  const registro = intentosPorIp.get(ip);

  // Solo cuentan los intentos FALLIDOS: si el login sale bien, se limpia el
  // contador. Asi nadie se queda fuera por entrar y salir varias veces.
  res.on('finish', () => {
    if (res.statusCode < 400) {
      intentosPorIp.delete(ip);
    }
  });

  if (!registro || ahora - registro.desde > VENTANA_MS) {
    intentosPorIp.set(ip, { desde: ahora, intentos: 1 });
    return next();
  }

  registro.intentos += 1;

  if (registro.intentos > INTENTOS_MAX) {
    const minutos = Math.ceil((VENTANA_MS - (ahora - registro.desde)) / 60000);
    return res.status(429).json({
      mensaje: `Demasiados intentos fallidos. Vuelve a intentarlo en ${minutos} minuto(s).`,
    });
  }

  next();
});

// Limpieza periodica para que el mapa no crezca sin control.
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, registro] of intentosPorIp) {
    if (ahora - registro.desde > VENTANA_MS) intentosPorIp.delete(ip);
  }
}, VENTANA_MS).unref();

// Montamos Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- DEFINICIÓN DE RUTAS ---
const dashboardRoutes = require('./routes/dashboardRoutes');
const clientesRoutes = require('./routes/clientesRoutes');
const authRoutes = require('./routes/authRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const expedienteRoutes = require('./routes/expedienteRoutes');
const documentosRoutes = require('./routes/documentosRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const gastosRoutes = require('./routes/gastosRoutes');
const audienciasRoutes = require('./routes/audicenciasRoutes');
const perfilFiscalRoutes = require('./routes/perfilFiscalRoutes'); 
const path = require('path');
const pool = require('./config/db');

// Servimos los archivos estáticos de la carpeta uploads para que Vue pueda acceder a ellos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/audiencias', audienciasRoutes);
app.use('/api/perfil-fiscal', perfilFiscalRoutes); 
app.use('/api/contabilidad/perfiles/cliente', perfilFiscalRoutes);


// Sonda de salud. Sirve para monitoreo y para mantener despierto el servicio
// en Render, que en plan gratuito se duerme a los 15 minutos (ver N-01).
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ estado: 'ok', bd: 'ok' });
  } catch (error) {
    res.status(503).json({ estado: 'degradado', bd: 'sin conexion' });
  }
});

// --- 404 ---
// Cualquier ruta desconocida responde JSON. Antes devolvia el HTML de Express
// y el .json() del front reventaba con un error que no decia nada.
app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// --- MANEJADOR DE ERRORES GLOBAL (los cuatro argumentos son obligatorios) ---
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS_NO_PERMITIDO') {
    console.warn('CORS rechazado para el origen:', err.origenRechazado);
    return res.status(403).json({ mensaje: 'Origen no autorizado' });
  }

  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE')) {
    return res.status(400).json({ mensaje: 'El archivo excede el tamano permitido o no se esperaba.' });
  }

  if (err && err.message === 'TIPO_ARCHIVO_NO_PERMITIDO') {
    return res.status(400).json({ mensaje: 'Solo se aceptan archivos PDF o imagenes.' });
  }

  // El detalle se queda en el servidor: al cliente no le contamos la
  // estructura de la base de datos.
  console.error('Error no controlado:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

// Iniciamos el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`Documentación en: http://localhost:${PORT}/api-docs`);
});