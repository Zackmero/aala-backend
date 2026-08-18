const Gasto = require("../models/gastosModel");

const db = require("../config/db");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const jwt = require("jsonwebtoken");

// Configuración de S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const obtenerGastosPorExpediente = async (req, res) => {
  try {
    const { id } = req.params;
    const gastos = await Gasto.obtenerPorExpediente(id);
    res.status(200).json(gastos);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const obtenerGastos = async (req, res) => {
  try {
    const gastos = await Gasto.obtenerTodos();
    res.status(200).json(gastos);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const crearGasto = async (req, res) => {
  try {
    const {
      expediente_id,
      abogado_id,
      concepto,
      categoria,
      monto,
      fecha_gasto,
      notas,
    } = req.body;

    const registrado_por = req.usuario.id;

    const datosGasto = {
      expediente_id,
      abogado_id,
      registrado_por,
      concepto,
      categoria,
      monto,
      fecha_gasto,
      notas,
      // Cambiamos el guardado local por la URL que nos devuelve S3
      comprobante_url: req.file ? req.file.location : null,
    };

    

    const nuevoId = await Gasto.crear(datosGasto);
    res.status(201).json({ mensaje: "Gasto registrado", id: nuevoId });
  } catch (error) {
    console.error("Error al crear gasto:", error);
    res
      .status(500)
      .json({ mensaje: "Error al guardar el gasto", error: error.message });
  }
};

const actualizarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
     const comprobanteRecibido = req.files && req.files.length > 0 ? req.files[0] : null;
    
 if (comprobanteRecibido) {
      try {
        // 1. Buscamos el pago en la base de datos ANTES de actualizarlo para ver si tiene comprobante
        const queryBuscar = "SELECT comprobante_url FROM gastos WHERE id = ?";
        const [resultados] = await db.query(queryBuscar, [id]);
        const gasto = resultados[0];
      // Extraemos la ruta exacta (Key) de S3 limpiando la URL
      
      const urlAWS = new URL(gasto.comprobante_url);
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

    // Si se sube un archivo nuevo a S3 al actualizar, actualizamos la URL
    if (req.file) {
      datosActualizados.comprobante_url = req.file.location;
    }

    const filasAfectadas = await Gasto.actualizar(id, datosActualizados);
    if (filasAfectadas === 0) {
      return res.status(404).json({ mensaje: "Gasto no encontrado" });
    }
    res.status(200).json({ mensaje: "Gasto actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    res
      .status(500)
      .json({ mensaje: "Error al actualizar el gasto", error: error.message });
  }
};

const eliminarGasto = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscamos el gasto para obtener la URL del archivo
    const queryBuscar = "SELECT comprobante_url FROM gastos WHERE id = ?";
    const [resultados] = await db.query(queryBuscar, [id]);
    const gasto = resultados[0];

    if (!gasto) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    // 2. Si existe un archivo en S3, lo borramos primero
    if (gasto.comprobante_url) {
      try {
        const urlAWS = new URL(gasto.comprobante_url);
        const fileKey = decodeURIComponent(urlAWS.pathname.substring(1));

        const command = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        });

        await s3.send(command);
      } catch (awsError) {
        console.error(
          "Error al borrar en AWS (se borrará de la BD de todos modos): ",
          awsError,
        );
      }
    }

    console.log("Eliminando gasto con ID controller:", id);
    // 3. Borramos el registro de la base de datos
    await Gasto.eliminar(id);
    res.status(200).json({ mensaje: "Gasto eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    res
      .status(500)
      .json({ mensaje: "Error al eliminar el gasto", error: error.message });
  }
};

const verComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    let token = req.headers["authorization"]?.split(" ")[1] || req.query.token;

    if (!token) {
      return res
        .status(403)
        .json({ error: "Token de autenticación requerido" });
    }

    jwt.verify(token, process.env.JWT_SECRET);

    const queryBuscar = "SELECT comprobante_url FROM gastos WHERE id = ?";
    const [resultados] = await db.query(queryBuscar, [id]);
    const gasto = resultados[0];

    if (!gasto || !gasto.comprobante_url) {
      return res.status(404).send("Comprobante no encontrado");
    }

    const urlAWS = new URL(gasto.comprobante_url);
    const fileKey = decodeURIComponent(urlAWS.pathname.substring(1));

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });

    const urlFirmada = await getSignedUrl(s3, command, { expiresIn: 60 });
    res.redirect(urlFirmada);
  } catch (error) {
    console.error("Error al generar la URL del comprobante:", error);
    res
      .status(500)
      .send("Token inválido o error al intentar visualizar el documento");
  }
};

module.exports = {
  obtenerGastosPorExpediente,
  obtenerGastos,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  verComprobante,
};
