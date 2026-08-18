const Pago = require("../models/pagoModel");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// Instanciamos el cliente S3 igual que en tus otros archivos
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const crearPago = async (req, res) => {
  try {
    // Extraemos los datos que nos mandará Vue
    const valores = req.body;
    const registrado_por = req.usuario ? req.usuario.id : null;
    valores.registrado_por = registrado_por;

    // Si AWS subió el archivo (en tu ruta dice upload.single('comprobante'))
    if (req.file) {
      // Tomamos la URL segura que nos devuelve S3 en "location"
      valores.comprobante_url = req.file.location;
    }

    const nuevoId = await Pago.crear(valores);

    res
      .status(201)
      .json({ mensaje: "Cobro registrado exitosamente", id: nuevoId });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res
      .status(500)
      .json({ mensaje: "Error al guardar el pago", error: error.message });
  }
};

const obtenerListaPagos = async (req, res) => {
  try {
    const pagos = await Pago.obtenerListaPagos();

    res.status(200).json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res
      .status(500)
      .json({ mensaje: "Error al cargar los pagos", error: error.message });
  }
};

const obtenerTotalPagos = async (req, res) => {
  try {
    const total = await Pago.obtenerTotalPagos();
    res.status(200).json({ total });
  } catch (error) {
    console.error("Error al obtener el total de pagos:", error);
    res.status(500).json({
      mensaje: "Error al cargar el total de pagos",
      error: error.message,
    });
  }
};

const obtenerPagosPorId = async (req, res) => {
  try {
    const { id } = req.params; // ID del expediente
    const pagos = await Pago.obtenerPorExpediente(id);
    res.status(200).json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res
      .status(500)
      .json({ mensaje: "Error al cargar los pagos", error: error.message });
  }
};

const actualizaPago = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    const comprobanteRecibido = req.files && req.files.length > 0 ? req.files[0] : null;
    
    if (comprobanteRecibido) {
      try {
        // 1. Buscamos el pago en la base de datos ANTES de actualizarlo para ver si tiene comprobante
        const queryBuscar = "SELECT comprobante_url FROM pagos WHERE id = ?";
        const [resultados] = await db.query(queryBuscar, [id]);
        const pago = resultados[0];
      // Extraemos la ruta exacta (Key) de S3 limpiando la URL
      
      const urlAWS = new URL(pago.comprobante_url);
      const fileKey = decodeURIComponent(urlAWS.pathname.substring(1));

      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      });

      await s3.send(command);
      
      } catch (awsError) {
        console.error(
          "Error al borrar archivo antiguo de AWS S3 (continuando con BD):",
          awsError,
        );
      }
    }

    // En tu ruta tienes uploadAWS.array('comprobante_url', 1), así que llega como req.files
    if (req.files && req.files.length > 0) {
      datosActualizados.comprobante_url = req.files[0].location;
    }
    // Por si en algún momento lo cambias a .single()
    else if (req.file) {
      datosActualizados.comprobante_url = req.file.location;
    }

    const filasAfectadas = await Pago.actualizar(id, datosActualizados);
    if (filasAfectadas === 0) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }


    res.status(200).json({ mensaje: "Pago actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    res
      .status(500)
      .json({ mensaje: "Error al actualizar el pago", error: error.message });
  }
};

const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscamos el pago en la base de datos ANTES de borrarlo para ver si tiene comprobante
    const queryBuscar = "SELECT comprobante_url FROM pagos WHERE id = ?";
    const [resultados] = await db.query(queryBuscar, [id]);
    const pago = resultados[0];

    if (pago && pago.comprobante_url) {
      try {
        // Extraemos la ruta exacta (Key) de S3 limpiando la URL
        const urlAWS = new URL(pago.comprobante_url);
        const fileKey = decodeURIComponent(urlAWS.pathname.substring(1));

        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        });

        await s3.send(command);
      } catch (awsError) {
        console.error(
          "Error al borrar archivo de AWS S3 (continuando con BD):",
          awsError,
        );
      }
    }

    const filasAfectadas = await Pago.eliminar(id);

    if (filasAfectadas === 0) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    res.status(200).json({ mensaje: "Pago eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res
      .status(500)
      .json({ mensaje: "Error al eliminar el pago", error: error.message });
  }
};

const verComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    // Capturamos el token de los headers o de la URL (?token=...)
    let token = req.headers["authorization"]?.split(" ")[1] || req.query.token;

    if (!token) {
      return res
        .status(403)
        .json({ error: "Token de autenticación requerido" });
    }

    // Verificamos que el token sea válido
    jwt.verify(token, process.env.JWT_SECRET);

    // 1. Buscamos el pago en la base de datos
    const queryBuscar = "SELECT comprobante_url FROM pagos WHERE id = ?";
    const [resultados] = await db.query(queryBuscar, [id]);
    const pago = resultados[0];

    if (!pago || !pago.comprobante_url) {
      return res.status(404).send("Comprobante no encontrado");
    }

    // 2. Extraemos el Key exacto de la URL guardada
    const urlAWS = new URL(pago.comprobante_url);
    const fileKey = decodeURIComponent(urlAWS.pathname.substring(1));

    // 3. Preparamos el comando para leer el archivo de S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });

    // 4. Generamos la URL firmada de S3 (expira en 60 segundos)
    const urlFirmada = await getSignedUrl(s3, command, { expiresIn: 60 });

    // 5. REDIRIGIMOS directamente. Como el servidor de Node es el que redirige,
    // evitamos por completo el error de CORS en el navegador de tu cliente.
    res.redirect(urlFirmada);
  } catch (error) {
    console.error("Error al generar la URL del comprobante:", error);
    res
      .status(500)
      .send("Token inválido o error al intentar visualizar el documento");
  }
};

module.exports = {
  crearPago,
  obtenerListaPagos,
  obtenerTotalPagos,
  obtenerPagosPorId,
  actualizaPago,
  eliminarPago,
  verComprobante,
};
