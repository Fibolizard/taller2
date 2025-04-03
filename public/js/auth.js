

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageArea = document.getElementById('message-area');


    const showMessage = (message, type = 'error') => {
        if (messageArea) {
            messageArea.textContent = message;
            messageArea.className = `message-area ${type === 'error' ? 'error-message' : 'success-message'}`;
        } else {
            alert(message);
        }
    };


    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showMessage('', '');

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

                    showMessage('Inicio de sesión exitoso. Redirigiendo...', 'success');

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {

                    showMessage(result.message || 'Error al iniciar sesión.', 'error');
                }
            } catch (error) {
                console.error('Error en fetch /api/login:', error);
                showMessage('Ocurrió un error de red. Inténtalo de nuevo.', 'error');
            }
        });
    }


    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showMessage('', '');

            const username = registerForm.username.value;
            const password = registerForm.password.value;








            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage(result.message, 'success');

                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {

                    showMessage(result.message || 'Error durante el registro.', 'error');
                }

            } catch (error) {
                console.error('Error en fetch /api/register:', error);
                showMessage('Ocurrió un error de red. Inténtalo de nuevo.', 'error');
            }
        });
    }
});