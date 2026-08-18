const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

// 1. Configuramos el cliente de S3 con las llaves que te dará AWS
const s3 = new S3Client({
  region: process.env.AWS_REGION, 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const limpiarTexto = (texto) => {
  if (!texto) return 'sin_clasificar';
  return texto
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .toLowerCase() // Convierte a minúsculas
    .replace(/\s+/g, '_') // Reemplaza espacios por guiones bajos
    .replace(/[^a-z0-9_]/g, ''); // Elimina caracteres especiales extraños
};

// 2. Configuramos Multer para subir directamente a S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Toma aala-despacho de tu archivo .env
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      // 1. Armamos el nombre del archivo primero (lo ocupamos en todos los casos)
      const nombreSistema = Date.now() + "-" + file.originalname;
      
      // Guardamos el nombre para poder insertarlo luego en la base de datos si se requiere
      file.nombreSistema = nombreSistema;

      // 2. ENRUTAMIENTO MÁGICO: Pagos, Gastos o Documentos
      
      // -- CASO A: PAGOS --
      if (file.fieldname === 'comprobante_pago' || file.fieldname === 'comprobante_url_pago') {
        // En pagos, el expediente_id suele venir en el body del formulario
        const expId = req.body.expediente_id || 'sin_expediente'; 
        cb(null, `pagos/expediente_${expId}/comprobantes/${nombreSistema}`);
      } 
      // -- CASO B: GASTOS --
      else if (file.fieldname === 'comprobante_gasto' || file.fieldname === 'comprobante_url_gasto') {
        const expIdGasto = req.body.expediente_id;
        
        // Limpiamos la categoría y el concepto que vienen del frontend
        const categoriaS3 = limpiarTexto(req.body.categoria);
        const conceptoS3 = limpiarTexto(req.body.concepto);
        
        // Si trae expediente_id (y no es string "null" o "undefined"), va a la carpeta del expediente
        if (expIdGasto && expIdGasto !== 'null' && expIdGasto !== 'undefined') {
            cb(null, `gastos/expediente_${expIdGasto}/${categoriaS3}/${conceptoS3}/${nombreSistema}`);
        } else {
            // Si no trae expediente, es un gasto del despacho
            cb(null, `gastos/generales/${categoriaS3}/${conceptoS3}/${nombreSistema}`);
        }
      }
      // -- CASO C: DOCUMENTOS LEGALES (Por Defecto) --
      else {
        // En documentos, el ID suele venir en los parámetros de la URL (req.params.id)
        const expId = req.params.id || req.body.expediente_id || "sin_expediente";
        
        // Limpiamos el tipo de documento (ej. "Acta de Nacimiento" -> "Acta_de_Nacimiento")
        const tipoDoc = req.body.tipo ? req.body.tipo.replace(/\s+/g, "_") : "otros";
        
        const rutaEstructurada = `documentos/expediente_${expId}/${tipoDoc}/${nombreSistema}`;
        cb(null, rutaEstructurada);
      }
    },
  }),
});

// Exportamos EXCLUSIVAMENTE 'upload' para que funcione el upload.array en tu enrutador
module.exports = upload;