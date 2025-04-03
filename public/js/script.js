// public/js/script.js (Modificado)

// --- Función para verificar estado de sesión y actualizar UI ---
// (Añadida aquí fuera del DOMContentLoaded para claridad, pero podría ir dentro también)
const checkLoginStatus = async () => {
    try {
        // Obtener el contenedor donde mostraremos el estado
        const userStatusContainer = document.getElementById('user-status-container');
        if (!userStatusContainer) {
            console.warn('Elemento con id "user-status-container" no encontrado.');
            return; // Salir si no existe el contenedor
        }

        // Preguntar al servidor por el estado de la sesión actual
        const response = await fetch('/api/session');
        if (!response.ok) { // Verificar si la respuesta de la API fue exitosa
             throw new Error(`Error en API: ${response.statusText}`);
        }
        const data = await response.json();

        userStatusContainer.innerHTML = ''; // Limpiar contenido anterior del contenedor

        if (data.loggedIn && data.user) {
            // --- Usuario CONECTADO ---
            // Crear mensaje de bienvenida
            const welcomeMessage = document.createElement('span');
            welcomeMessage.textContent = `Bienvenido, ${data.user.username}!`;
            welcomeMessage.style.fontWeight = 'bold'; // Poner en negrita
            welcomeMessage.style.marginRight = '10px'; // Espacio a la derecha

            // Crear botón de Cerrar Sesión
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Cerrar Sesión';
            logoutButton.classList.add('btn', 'btn-danger', 'btn-sm'); // Estilos de botón

            // Añadir evento al botón de logout
            logoutButton.addEventListener('click', async () => {
                try {
                    // Enviar petición POST para cerrar sesión al servidor
                    const logoutResponse = await fetch('/api/logout', { method: 'POST' });
                    if (logoutResponse.ok) {
                        // Si el logout fue exitoso, volver a verificar el estado para actualizar la UI
                        checkLoginStatus();
                        // Opcional: podrías redirigir a la home o mostrar un mensaje
                        // window.location.reload(); // Recargar la página es una opción simple
                    } else {
                        alert('Error al cerrar sesión.'); // Mostrar alerta si falla
                    }
                } catch (error) {
                    console.error('Error en fetch /api/logout:', error);
                    alert('Error de red al intentar cerrar sesión.');
                }
            });

            // Añadir el mensaje y el botón al contenedor
            userStatusContainer.appendChild(welcomeMessage);
            userStatusContainer.appendChild(logoutButton);

        } else {
            // --- Usuario NO CONECTADO ---
            // Crear enlace/botón para Iniciar Sesión
            const loginLink = document.createElement('a');
            loginLink.href = '/login.html'; // Enlace a la página de login
            loginLink.textContent = 'Iniciar Sesión';
            loginLink.classList.add('btn', 'btn-primary', 'btn-sm'); // Estilos

            // Crear enlace/botón para Registrarse
            const registerLink = document.createElement('a');
            registerLink.href = '/register.html'; // Enlace a la página de registro
            registerLink.textContent = 'Registrarse';
            registerLink.classList.add('btn', 'btn-success', 'btn-sm'); // Estilos
            registerLink.style.marginLeft = '10px'; // Espacio entre botones

            // Añadir los enlaces/botones al contenedor
            userStatusContainer.appendChild(loginLink);
            userStatusContainer.appendChild(registerLink);
        }

    } catch (error) {
        console.error('Error verificando estado de sesión:', error);
        const userStatusContainer = document.getElementById('user-status-container');
        if (userStatusContainer) {
            // Mostrar un mensaje de error en la UI si falla la comprobación
            userStatusContainer.innerHTML = '<span style="color:red; font-size: 0.9em;">Error al cargar estado</span>';
        }
    }
};


// --- Event Listener Principal (cuando el HTML está listo) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores de Elementos (tu código existente) ---
    const contenedorProductos = document.getElementById('contenedor-productos');
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const carouselInner = document.querySelector('.carousel-inner');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // --- Variables Globales (tu código existente) ---
    let productosGlobal = [];
    let items = [];
    let currentIndex = 0;
    let autoPlayInterval;

    // --- Función para cargar productos (¡CORREGIDA!) ---
    const cargarProductos = async () => {
        // Validar que el contenedor existe antes de usarlo
        if (!contenedorProductos) {
            console.error("El elemento 'contenedor-productos' no se encontró.");
            return;
        }
        try {
            // ¡IMPORTANTE! Usar la ruta API definida en server.js
            const respuesta = await fetch('/api/productos'); // <-- CORREGIDO
            if (!respuesta.ok) { // Siempre verifica si la respuesta fue exitosa
                throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
            }
            const productos = await respuesta.json();
            productosGlobal = productos;
            mostrarProductos(productos);

            // Solo iniciar carrusel si el contenedor existe y hay productos
            if (carouselInner && productos.length > 0) {
                 iniciarCarrusel();
            } else if (!carouselInner) {
                 console.warn("Elemento '.carousel-inner' no encontrado, no se iniciará el carrusel.");
            }

        } catch (error) {
            console.error('Error al cargar los productos:', error);
            contenedorProductos.innerHTML = '<p>Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>';
        }
    };

    // --- Mostrar productos en la página (tu código existente) ---
    const mostrarProductos = (productos) => {
        if (!contenedorProductos) return; // Salir si no hay contenedor
        contenedorProductos.innerHTML = ''; // Limpiar antes de mostrar
        if (productos.length === 0) {
             contenedorProductos.innerHTML = '<p>No se encontraron productos que coincidan.</p>';
             return;
        }
        productos.forEach(producto => {
            const productoHTML = document.createElement('div');
            productoHTML.classList.add('producto'); // Asegúrate que esta clase exista en tu CSS
            // Usar rutas absolutas para imágenes si 'img' está en la raíz de 'public'
            const imagePath = `/img/${producto.imagen}`;
            productoHTML.innerHTML = `
                <img src="${imagePath}" alt="${producto.nombre}" onerror="this.src='/img/placeholder.png'; this.alt='Imagen no disponible'"> <h3>${producto.nombre || 'Sin nombre'}</h3>
                <p>${producto.descripcion || 'Sin descripción'}</p>
                <p>Precio: $${(producto.precio || 0).toFixed(2)}</p>
                <p class="categoria">Categoría: ${producto.categoria || 'Sin categoría'}</p>
            `;
            contenedorProductos.appendChild(productoHTML);
        });
    };

    // --- Filtrado de productos (tu código existente, con validación) ---
    const filterProducts = () => {
         if (!searchInput || !categorySelect) return; // Salir si no existen los inputs

        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;

        const productosFiltrados = productosGlobal.filter(producto => {
            // Validar que las propiedades existan antes de accederlas
            const nombre = (producto.nombre || '').toLowerCase();
            const descripcion = (producto.descripcion || '').toLowerCase();
            const categoria = producto.categoria || '';

            const coincideBusqueda = nombre.includes(searchTerm) || descripcion.includes(searchTerm);
            const coincideCategoria = selectedCategory === "" || categoria === selectedCategory;
            return coincideBusqueda && coincideCategoria;
        });

        mostrarProductos(productosFiltrados); // Mostrar resultado del filtro
    };

    // --- Inicializar carrusel (tu código existente, con validaciones) ---
    const iniciarCarrusel = () => {
         // Validaciones importantes
         if (!carouselInner || !prevBtn || !nextBtn || productosGlobal.length === 0) {
            console.log("No se puede inicializar el carrusel: falta algún elemento o no hay productos.");
            // Ocultar botones si no hay carrusel
            if(prevBtn) prevBtn.style.display = 'none';
            if(nextBtn) nextBtn.style.display = 'none';
            return;
         }

        carouselInner.innerHTML = ''; // Limpiar carrusel previo
        // Seleccionar productos populares (ej: los 3 primeros o según una propiedad 'popular')
        const populares = productosGlobal.filter(p => p.popular).slice(0, 5); // Ejemplo: 5 populares
        // Si no hay 'populares', usar los primeros 3 como fallback
        const itemsParaCarrusel = populares.length > 0 ? populares : productosGlobal.slice(0, 3);

        if (itemsParaCarrusel.length === 0) {
             console.log("No hay suficientes productos para el carrusel.");
             prevBtn.style.display = 'none';
             nextBtn.style.display = 'none';
             return; // No hacer nada si no hay items
        }


        itemsParaCarrusel.forEach((producto, index) => {
            const contenedorItem = document.createElement('div');
            contenedorItem.classList.add('carousel-item');
            if(index === 0) contenedorItem.classList.add('active'); // Activar el primero

            const img = document.createElement('img');
             // Usar ruta absoluta y fallback
            img.src = `/img/${producto.imagen}`;
            img.alt = producto.nombre || 'Imagen de producto';
            img.onerror = function() { this.src='/img/placeholder.png'; this.alt='Imagen no disponible'; }; // Fallback

            contenedorItem.appendChild(img);
            carouselInner.appendChild(contenedorItem);
        });

        items = carouselInner.querySelectorAll('.carousel-item'); // Actualizar la lista de items
        currentIndex = 0; // Empezar desde el primero

        // Mostrar botones ahora que el carrusel está listo
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';

        // Limpiar intervalo anterior si existiera
        if (autoPlayInterval) clearInterval(autoPlayInterval);

        // Iniciar auto-play solo si hay más de un item
        if (items.length > 1) {
            autoPlayInterval = setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000); // Cambiar cada 5 segundos
        } else {
             // Si solo hay un item, ocultar botones de navegación manual
             prevBtn.style.display = 'none';
             nextBtn.style.display = 'none';
        }


        // Navegación manual (asegurarse que los listeners no se dupliquen)
        // Remover listeners previos podría ser necesario si esta función se llama múltiples veces
        prevBtn.onclick = () => { // Usar .onclick para reemplazar listener previo fácilmente
            if (items.length > 1) {
                showSlide(currentIndex - 1);
                resetAutoPlay();
            }
        };
        nextBtn.onclick = () => {
             if (items.length > 1) {
                showSlide(currentIndex + 1);
                resetAutoPlay();
             }
        };
    };

    // --- Mostrar slide (tu código existente, con validación) ---
    const showSlide = (index) => {
        if (!items || items.length === 0) return; // Salir si no hay items
        items[currentIndex].classList.remove('active');
        currentIndex = (index + items.length) % items.length; // Cálculo correcto del índice circular
        items[currentIndex].classList.add('active');
    };

    // --- Reiniciar auto-play (tu código existente, con validación) ---
    const resetAutoPlay = () => {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        // Reiniciar solo si hay más de un item
        if (items && items.length > 1) {
            autoPlayInterval = setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000);
        }
    };

    // --- Eventos para filtrar productos (tu código existente, con validación) ---
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    } else {
         console.warn("Elemento '#search-input' no encontrado.");
    }
    if (categorySelect) {
        categorySelect.addEventListener('change', filterProducts);
    } else {
        console.warn("Elemento '#category-select' no encontrado.");
    }


    // --- Ejecutar funciones iniciales ---
    checkLoginStatus(); // <--- ¡LLAMAR A LA FUNCIÓN PARA VERIFICAR LOGIN!
    cargarProductos();  // Cargar productos al iniciar

}); // Fin de DOMContentLoaded