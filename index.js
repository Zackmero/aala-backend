// Importamos las dependencias necesarias
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// IMPORTANTE: Cargamos los JSON primero para asegurar que existan
const clientesDocs = require('./docs/clientes.swagger.json');
const authDocs = require('./docs/auth.swagger.json');
const catalogosDocs = require('./docs/catalogos.swagger.json');
const expedienteDocs = require('./docs/expediente.swagger.json'); 

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
      { url: "http://localhost:3000", description: "Servidor Local" }
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
      ...expedienteDocs.paths 
    },
    security: [{ bearerAuth: [] }],
  },
  // Dejamos apis vacío porque ya estamos cargando todo desde los JSON manuales
  apis: [], 
};

// Generamos la especificación
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 

// Montamos Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- DEFINICIÓN DE RUTAS ---
const clientesRoutes = require('./routes/clientesRoutes');
const authRoutes = require('./routes/authRoutes');
const catalogosRoutes = require('./routes/catalogosRoutes');
const expedienteRoutes = require('./routes/expedienteRoutes');

app.use('/api/clientes', clientesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/expedientes', expedienteRoutes);

// Iniciamos el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`Documentación en: http://localhost:${PORT}/api-docs`);
});