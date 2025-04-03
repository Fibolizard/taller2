



const checkLoginStatus = async () => {
    try {
        
        const userStatusContainer = document.getElementById('user-status-container');
        if (!userStatusContainer) {
            console.warn('Elemento con id "user-status-container" no encontrado.');
            return; 
        }

        
        const response = await fetch('/api/session');
        if (!response.ok) { 
             throw new Error(`Error en API: ${response.statusText}`);
        }
        const data = await response.json();

        userStatusContainer.innerHTML = ''; 

        if (data.loggedIn && data.user) {
            
            
            const welcomeMessage = document.createElement('span');
            welcomeMessage.textContent = `Bienvenido, ${data.user.username}!`;
            welcomeMessage.style.fontWeight = 'bold'; 
            welcomeMessage.style.marginRight = '10px'; 

            
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Cerrar Sesión';
            logoutButton.classList.add('btn', 'btn-danger', 'btn-sm'); 

            
            logoutButton.addEventListener('click', async () => {
                try {
                    
                    const logoutResponse = await fetch('/api/logout', { method: 'POST' });
                    if (logoutResponse.ok) {
                        
                        checkLoginStatus();
                        
                        
                    } else {
                        alert('Error al cerrar sesión.'); 
                    }
                } catch (error) {
                    console.error('Error en fetch /api/logout:', error);
                    alert('Error de red al intentar cerrar sesión.');
                }
            });

            
            userStatusContainer.appendChild(welcomeMessage);
            userStatusContainer.appendChild(logoutButton);

        } else {
            
            
            const loginLink = document.createElement('a');
            loginLink.href = '/login.html'; 
            loginLink.textContent = 'Iniciar Sesión';
            loginLink.classList.add('btn', 'btn-primary', 'btn-sm'); 

            
            const registerLink = document.createElement('a');
            registerLink.href = '/register.html'; 
            registerLink.textContent = 'Registrarse';
            registerLink.classList.add('btn', 'btn-success', 'btn-sm'); 
            registerLink.style.marginLeft = '10px'; 

            
            userStatusContainer.appendChild(loginLink);
            userStatusContainer.appendChild(registerLink);
        }

    } catch (error) {
        console.error('Error verificando estado de sesión:', error);
        const userStatusContainer = document.getElementById('user-status-container');
        if (userStatusContainer) {
            
            userStatusContainer.innerHTML = '<span style="color:red; font-size: 0.9em;">Error al cargar estado</span>';
        }
    }
};



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

    
    const cargarProductos = async () => {
        
        if (!contenedorProductos) {
            console.error("El elemento 'contenedor-productos' no se encontró.");
            return;
        }
        try {
            
            const respuesta = await fetch('/api/productos'); 
            if (!respuesta.ok) { 
                throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
            }
            const productos = await respuesta.json();
            productosGlobal = productos;
            mostrarProductos(productos);

            
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

    
    const mostrarProductos = (productos) => {
        if (!contenedorProductos) return; 
        contenedorProductos.innerHTML = ''; 
        if (productos.length === 0) {
             contenedorProductos.innerHTML = '<p>No se encontraron productos que coincidan.</p>';
             return;
        }
        productos.forEach(producto => {
            const productoHTML = document.createElement('div');
            productoHTML.classList.add('producto'); 
            
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

    
    const filterProducts = () => {
         if (!searchInput || !categorySelect) return; 

        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;

        const productosFiltrados = productosGlobal.filter(producto => {
            
            const nombre = (producto.nombre || '').toLowerCase();
            const descripcion = (producto.descripcion || '').toLowerCase();
            const categoria = producto.categoria || '';

            const coincideBusqueda = nombre.includes(searchTerm) || descripcion.includes(searchTerm);
            const coincideCategoria = selectedCategory === "" || categoria === selectedCategory;
            return coincideBusqueda && coincideCategoria;
        });

        mostrarProductos(productosFiltrados); 
    };

    
    const iniciarCarrusel = () => {
         
         if (!carouselInner || !prevBtn || !nextBtn || productosGlobal.length === 0) {
            console.log("No se puede inicializar el carrusel: falta algún elemento o no hay productos.");
            
            if(prevBtn) prevBtn.style.display = 'none';
            if(nextBtn) nextBtn.style.display = 'none';
            return;
         }

        carouselInner.innerHTML = ''; 
        
        const populares = productosGlobal.filter(p => p.popular).slice(0, 5); 
        
        const itemsParaCarrusel = populares.length > 0 ? populares : productosGlobal.slice(0, 3);

        if (itemsParaCarrusel.length === 0) {
             console.log("No hay suficientes productos para el carrusel.");
             prevBtn.style.display = 'none';
             nextBtn.style.display = 'none';
             return; 
        }


        itemsParaCarrusel.forEach((producto, index) => {
            const contenedorItem = document.createElement('div');
            contenedorItem.classList.add('carousel-item');
            if(index === 0) contenedorItem.classList.add('active'); 

            const img = document.createElement('img');
             
            img.src = `/img/${producto.imagen}`;
            img.alt = producto.nombre || 'Imagen de producto';
            img.onerror = function() { this.src='/img/placeholder.png'; this.alt='Imagen no disponible'; }; 

            contenedorItem.appendChild(img);
            carouselInner.appendChild(contenedorItem);
        });

        items = carouselInner.querySelectorAll('.carousel-item'); 
        currentIndex = 0; 

        
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';

        
        if (autoPlayInterval) clearInterval(autoPlayInterval);

        
        if (items.length > 1) {
            autoPlayInterval = setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000); 
        } else {
             
             prevBtn.style.display = 'none';
             nextBtn.style.display = 'none';
        }


        
        
        prevBtn.onclick = () => { 
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

    
    const showSlide = (index) => {
        if (!items || items.length === 0) return; 
        items[currentIndex].classList.remove('active');
        currentIndex = (index + items.length) % items.length; 
        items[currentIndex].classList.add('active');
    };

    
    const resetAutoPlay = () => {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        
        if (items && items.length > 1) {
            autoPlayInterval = setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000);
        }
    };

    
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


    
    checkLoginStatus(); 
    cargarProductos();  

}); 