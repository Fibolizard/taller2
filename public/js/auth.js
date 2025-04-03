// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageArea = document.getElementById('message-area'); // Para mostrar mensajes

    // Función para mostrar mensajes
    const showMessage = (message, type = 'error') => {
        if (messageArea) {
            messageArea.textContent = message;
            messageArea.className = `message-area ${type === 'error' ? 'error-message' : 'success-message'}`; // Aplica clases CSS
        } else {
            alert(message); // Fallback si no hay área de mensajes
        }
    };

    // --- Manejador de Inicio de Sesión ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevenir envío tradicional del formulario
            showMessage('', ''); // Limpiar mensajes previos

            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    // Inicio de sesión exitoso
                    showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');
                    // Redirigir a la página principal después de un breve retraso
                    setTimeout(() => {
                        window.location.href = '/'; // Redirige a index.html
                    }, 1500);
                } else {
                    // Error de inicio de sesión (ej. credenciales inválidas)
                    showMessage(result.message || 'Error al iniciar sesión.', 'error');
                }
            } catch (error) {
                console.error('Error en fetch /api/login:', error);
                showMessage('Ocurrió un error de red. Inténtalo de nuevo.', 'error');
            }
        });
    }

    // --- Manejador de Registro ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showMessage('', ''); // Limpiar mensajes previos

            const username = registerForm.username.value;
            const password = registerForm.password.value;
            // const confirmPassword = registerForm['confirm-password'] ? registerForm['confirm-password'].value : null;

            // // Opcional: Validación de confirmar contraseña en el frontend
            // if (confirmPassword !== null && password !== confirmPassword) {
            //     showMessage('Las contraseñas no coinciden.', 'error');
            //     return;
            // }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) { // Status 201 Created
                    showMessage(result.message, 'success');
                     // Opcional: Redirigir a login tras registro exitoso
                     setTimeout(() => {
                         window.location.href = '/login.html';
                     }, 2000);
                } else {
                    // Error de registro (ej. usuario ya existe, error de servidor)
                     showMessage(result.message || 'Error durante el registro.', 'error');
                }

            } catch (error) {
                console.error('Error en fetch /api/register:', error);
                showMessage('Ocurrió un error de red. Inténtalo de nuevo.', 'error');
            }
        });
    }
});