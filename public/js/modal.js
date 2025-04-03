document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM cargado, buscando productos...");

    const contenedorProductos = document.getElementById('contenedor-productos');
    if (!contenedorProductos) {
        console.error("No se encontró #contenedor-productos");
        return;
    }

    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalImage = document.getElementById('modal-image');
    const modalDescription = document.getElementById('modal-description');
    const modalPrice = document.getElementById('modal-price');
    const modalClose = document.querySelector('.modal-content .close');
    const addToCartBtn = document.getElementById('add-to-cart');

    if (!modal || !modalTitle || !modalImage || !modalDescription || !modalPrice || !modalClose || !addToCartBtn) {
        console.error("No se encontraron los elementos del modal correctamente");
        return;
    }

    // Delegación de eventos: aseguramos que los elementos dinámicos respondan al evento click
    contenedorProductos.addEventListener('click', (event) => {
        let productElement = event.target.closest('.producto');
        if (!productElement) return; // Si no hizo clic en un producto, salir

        console.log("Producto clickeado:", productElement);

        // Extraer datos del producto (depende de cómo los renders en HTML)
        const nombre = productElement.querySelector('h3')?.textContent || "Producto sin nombre";
        const imagenSrc = productElement.querySelector('img')?.src || "";
        const descripcion = productElement.querySelector('p')?.textContent || "Sin descripción";
        const precio = productElement.querySelector('p:nth-of-type(2)')?.textContent || "Precio desconocido";

        modalTitle.textContent = nombre;
        modalImage.src = imagenSrc;
        modalImage.alt = nombre;
        modalDescription.textContent = descripcion;
        modalPrice.textContent = precio;

        modal.style.display = 'block';

        // Evento para añadir al carrito
        addToCartBtn.onclick = () => {
            alert(`Se añadió "${nombre}" al carrito.`);
        };
    });

    // Evento para cerrar el modal
    modalClose.onclick = () => {
        modal.style.display = 'none';
    };

    // Cerrar modal al hacer clic fuera del contenido
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
