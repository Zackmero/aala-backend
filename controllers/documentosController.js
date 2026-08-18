// controllers/documentoController.js
const DocumentoModel = require("../models/DocumentoModel");
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const subirDocumentos = async (req, res) => {
  try {
    const payload = req.body;

    // req.files trae los archivos físicos (gracias a Multer)
    const archivos = req.files;
    if (!archivos || archivos.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "No se seleccionó ningún archivo." });
    }

    const valoresInsert = req.files.map((file) => [
      payload.expediente_id,
      file.originalname, // nombre_original
      file.nombreSistema, // nombre_sistema (el que generamos en AWS)
      file.location, // ruta_url (Link de S3 devuelto por multer-s3)
      payload.tipo, // tipo_documento
      payload.notas, // notas
      payload.subido_por, // subido_por
    ]);

    // Mandamos a guardar a MySQL
    await DocumentoModel.crearMultiples(valoresInsert);

    res.status(200).json({
      mensaje: "Documentos organizados y guardados en la nube exitosamente",
      cantidad: req.files.length,
    });

    // Preparamos los datos exactos como los pide el Modelo (Bulk Insert)
    // const datosParaInsertar = archivos.map((archivo) => [
    //   expediente_id,
    //   archivo.originalname, // Ej: foto_ine.jpg
    //   archivo.filename, // Ej: 1234567-foto_ine.jpg
    //   `/uploads/documentos/${archivo.filename}`, // La URL para que Vue lo encuentre
    //   tipo,
    //   notas || "",
    //   subido_por,
    // ])
  } catch (error) {
    console.error("Error al subir documentos:", error);
    res.status(500).json({
      mensaje: "Error interno al guardar los archivos",
      error: error.message,
    });
  }
};

// ANTES DE AWS
// const obtenerDocumentos = async (req, res) => {
//   try {
//     const expediente_id = req.params.id;
//     const documentos = await Documento.obtenerPorExpediente(expediente_id);
// console.log("Documentos obtenidos:", documentos);
//     res.status(200).json(documentos);
//   } catch (error) {
//     console.error("Error al obtener documentos:", error);
//     res
//       .status(500)
//       .json({ mensaje: "Error al cargar archivos", error: error.message });
//   }
// };

//? OBTENER CON AWS IMAGENES
const obtenerDocumentos = async (req, res) => {
  try {
    const expediente_id = req.params.id;

    // Llamamos al modelo para obtener los registros de la base de datos
    const resultados = await DocumentoModel.obtenerPorExpediente(expediente_id);

    // Recorremos la lista de documentos para generar una URL segura de AWS para cada uno
    const documentosConUrlSegura = await Promise.all(
      resultados.map(async (doc) => {
        // 1. Armamos la ruta exacta (Key) basándonos en cómo se ve en tu imagen
        // Ejemplo: documentos/expediente_11/INE/1785124016836-lupa.jpg
        const tipoDoc = doc.tipo_documento
          ? doc.tipo_documento.replace(/\s+/g, "_")
          : "otros";
        const fileKey = `documentos/expediente_${doc.expediente_id}/${tipoDoc}/${doc.nombre_sistema}`;

        // 2. Preparamos el comando para pedirle el archivo a AWS
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey,
        });

        // 3. Generamos la URL temporal (expiresIn: 3600 significa que dura 1 hora)
        const urlFirmada = await getSignedUrl(s3, command, { expiresIn: 3600 });

        // 4. Retornamos el documento, reemplazando la ruta normal por la URL firmada
        return {
          ...doc,
          ruta_url: urlFirmada,
        };
      }),
    );

    // Devolvemos la lista de documentos al frontend ya con las URLs seguras
    res.status(200).json(documentosConUrlSegura);
  } catch (error) {
    console.error("Error al obtener los documentos: ", error);
    res.status(500).json({ error: "Hubo un error al obtener los documentos" });
  }
};



const eliminarDocumento = async (req, res) => {
  try {
    const { expedienteId, documentoId } = req.params;

    // 1. Buscamos el documento en la base de datos para obtener su información
    const documento = await DocumentoModel.obtenerDocumentoPorId(documentoId);

    // 2. Reconstruimos la ruta exacta (Key) que tiene en AWS S3
    const tipoDoc = documento.tipo_documento ? documento.tipo_documento.replace(/\s+/g, '_') : 'otros';
    const fileKey = `documentos/expediente_${documento.expediente_id}/${tipoDoc}/${documento.nombre_sistema}`;

 
    // 3. Preparamos y enviamos el comando para que AWS lo elimine de la nube
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    });

    // s3 es la constante que ya tienes configurada arriba en tu archivo
    await s3.send(command);

    // 4. Lo eliminamos de nuestra base de datos relacional
    await DocumentoModel.eliminar(documentoId);

    res
      .status(200)
      .json({ mensaje: "Documento eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    res.status(500).json({
      mensaje: "Error al eliminar el documento",
      error: error.message,
    });
  }
};

module.exports = {
  subirDocumentos,
  obtenerDocumentos,
  eliminarDocumento,
};
