const express = require('express');
const app = express();
const port = 3000; // Puedes cambiar el puerto si lo deseas
// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));
// Endpoint API para obtener los productos desde productos.json
app.get('/public/productos', (req, res) => {
    const productos = require('./productos.json'); // Cargar el archivo
    JSON
    res.json(productos); // Enviar los productos como respuesta JSON
});
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});