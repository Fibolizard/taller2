document.addEventListener('DOMContentLoaded', () => {
    const contenedorProductos = document.getElementById('contenedor-productos');
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const carouselInner = document.querySelector('.carousel-inner');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let productosGlobal = [];
    let items = [];
    let currentIndex = 0;
    let autoPlayInterval;

    // Función para cargar productos
    const cargarProductos = async () => {
        try {
            const respuesta = await fetch('../productos/productos.json');
            const productos = await respuesta.json();
            productosGlobal = productos;
            mostrarProductos(productos);
            iniciarCarrusel();
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            contenedorProductos.innerHTML = '<p>Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
        }
    };

    // Mostrar productos en la página
    const mostrarProductos = (productos) => {
        contenedorProductos.innerHTML = '';
        productos.forEach(producto => {
            const productoHTML = document.createElement('div');
            productoHTML.classList.add('producto');
            productoHTML.innerHTML = `
                <img src="img/${producto.imagen}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <p>Precio: $${producto.precio.toFixed(2)}</p>
                <p class="categoria">Categoría: ${producto.categoria}</p>
            `;
            contenedorProductos.appendChild(productoHTML);
        });
    };

    // Filtrado de productos según búsqueda y categoría
    const filterProducts = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;
        
        const productosFiltrados = productosGlobal.filter(producto => {
            const coincideBusqueda = producto.nombre.toLowerCase().includes(searchTerm) ||
                                     producto.descripcion.toLowerCase().includes(searchTerm);
            const coincideCategoria = selectedCategory === "" || producto.categoria === selectedCategory;
            return coincideBusqueda && coincideCategoria;
        });
        
        mostrarProductos(productosFiltrados);
    };

    // Inicializar carrusel con transición de fade y botones de navegación
    const iniciarCarrusel = () => {
        // Seleccionar productos populares (en este ejemplo, los 3 primeros)
        const populares = productosGlobal.slice(0, 3);
        
        populares.forEach((producto, index) => {
            const contenedorItem = document.createElement('div');
            contenedorItem.classList.add('carousel-item');
            // Asigna la clase "active" solo al primer elemento
            if(index === 0) contenedorItem.classList.add('active');

            const img = document.createElement('img');
            img.src = "img/" + producto.imagen;
            img.alt = producto.nombre;
            
            contenedorItem.appendChild(img);
            carouselInner.appendChild(contenedorItem);
        });
        
        items = document.querySelectorAll('.carousel-item');
        currentIndex = 0;
        
        autoPlayInterval = setInterval(() => {
            showSlide(currentIndex + 1);
        }, 5000);
        
        // Navegación manual con botones
        prevBtn.addEventListener('click', () => {
            showSlide(currentIndex - 1);
            resetAutoPlay();
        });
        nextBtn.addEventListener('click', () => {
            showSlide(currentIndex + 1);
            resetAutoPlay();
        });
    };

    // Mostrar el slide en base al índice con transición
    const showSlide = (index) => {
        items[currentIndex].classList.remove('active');
        currentIndex = (index + items.length) % items.length;
        items[currentIndex].classList.add('active');
    };

    // Reinicia el auto-play al interactuar manualmente
    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            showSlide(currentIndex + 1);
        }, 5000);
    };

    // Eventos para filtrar productos
    searchInput.addEventListener('input', filterProducts);
    categorySelect.addEventListener('change', filterProducts);

    // Cargar productos al iniciar
    cargarProductos();
});
