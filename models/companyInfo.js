const mongoose = require('mongoose');

const companyInfoSchema = new mongoose.Schema({
    mision: String,
    vision: String,
    integrantes: [{
        nombre: String,
        apellido: String
    }]
});

module.exports = mongoose.model('CompanyInfo', companyInfoSchema); // 'CompanyInfo' será el nombre de la colección
 
