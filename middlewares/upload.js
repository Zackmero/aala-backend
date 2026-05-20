// middlewares/upload.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuramos dónde y cómo se guardarán los archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // La carpeta física en tu servidor donde vivirán los archivos
        const dir = './uploads/documentos';
        
        // Si la carpeta no existe, Node.js la crea automáticamente
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Le ponemos un sello de tiempo para evitar que archivos con el mismo nombre se sobreescriban
        const sufijoUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Ejemplo de resultado: 168435123-ine_frontal.pdf
        cb(null, sufijoUnico + '-' + file.originalname);
    }
});

// Le decimos a multer que acepte múltiples archivos
const upload = multer({ storage: storage });

module.exports = upload;