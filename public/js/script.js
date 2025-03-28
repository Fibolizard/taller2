document.addEventListener('DOMContentLoaded', () => {

    const contenedorProductos = document.getElementById('contenedor-productos');

    // Función para cargar los productos desde el servidor (API)
    const cargarProductos = async () => {
        try {
            const respuesta = await fetch('../productos/productos.json'); // Petición al backend
            const productos = await respuesta.json(); // Convertir la respuesta a JSON

            mostrarProductos(productos); // Mostrar los productos en la página
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            contenedorProductos.innerHTML = '<p>Error al cargar los productos.Por favor, intenta de nuevo más tarde.</p > ';
        }
    };
    // Función para mostrar los productos en el HTML
    const mostrarProductos = (productos) => {
        contenedorProductos.innerHTML = ''; // Limpiar el contenedor antes de agregar nuevos productos
        productos.forEach(producto => {
            const productoHTML = document.createElement('div');
            productoHTML.classList.add('producto'); // Clase CSS para estilos
            productoHTML.innerHTML = `
    <img src="img/${producto.imagen}"
    alt="${producto.nombre}"> <!-- TODO: Asegurarse de tener las imágenes o
    usar URLs de imágenes -->
    <h3>${producto.nombre}</h3>
    <p>${producto.descripcion}</p>
    <p>Precio: $${producto.precio.toFixed(2)}</p>
    `;
            contenedorProductos.appendChild(productoHTML);
        });
    };
    // Inicializar la carga de productos al cargar la página
    cargarProductos();
    // TODO: Implementar la lógica del carrusel aquí (usando JavaScriptadicional o una librería)
    
    });