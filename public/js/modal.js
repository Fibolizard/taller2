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

    
    contenedorProductos.addEventListener('click', (event) => {
        let productElement = event.target.closest('.producto');
        if (!productElement) return; 

        console.log("Producto clickeado:", productElement);

        
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

        
        addToCartBtn.onclick = () => {
            alert(`Se añadió "${nombre}" al carrito.`);
        };
    });

    
    modalClose.onclick = () => {
        modal.style.display = 'none';
    };

    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
