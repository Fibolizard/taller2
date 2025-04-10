const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: String,
    imagen: String, // O guarda la URL de la imagen si la subes a un servicio como AWS S3, Cloudinary, etc.
    precio: { type: Number, required: true, min: 0 },
    rebaja: { type: Boolean, default: false } // Checkbox de rebaja
});

module.exports = mongoose.model('Product', productoSchema); // 'Product' será el nombre de la colección (en plural 'products' por convención)
