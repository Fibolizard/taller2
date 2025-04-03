// server.js (SIN LIBRERÍAS ADICIONALES - ¡INSEGURO!)

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Módulo incorporado de Node.js

const app = express();
const port = 3000;
const usersFilePath = path.join(__dirname, 'users.json');
const sessionsFilePath = path.join(__dirname, 'sessions.json'); // Para persistencia básica de tokens

// --- Middleware ---
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Almacenamiento Simple de Sesiones/Tokens (¡Muy Básico!) ---
// Usaremos un archivo JSON para una persistencia mínima entre reinicios del servidor.
// En una app real, esto sería una base de datos o un almacén de sesiones adecuado.
const readSessions = () => {
    try {
        if (!fs.existsSync(sessionsFilePath)) {
            fs.writeFileSync(sessionsFilePath, JSON.stringify({}));
            return {};
        }
        const sessionsData = fs.readFileSync(sessionsFilePath);
        return JSON.parse(sessionsData);
    } catch (error) {
        console.error("Error leyendo sessions.json:", error);
        return {};
    }
};

const writeSessions = (sessions) => {
    try {
        fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2));
    } catch (error) {
        console.error("Error escribiendo en sessions.json:", error);
    }
};

let activeSessions = readSessions(); // Cargar sesiones al iniciar

// --- Funciones de Usuario (con crypto - ¡Menos Seguro que bcrypt!) ---
const readUsers = () => {
    try {
        if (!fs.existsSync(usersFilePath)) {
            fs.writeFileSync(usersFilePath, JSON.stringify([]));
            return [];
        }
        const usersData = fs.readFileSync(usersFilePath);
        // Asegurarse de que el archivo no esté vacío antes de parsear
        return usersData.length > 0 ? JSON.parse(usersData) : [];
    } catch (error) {
        console.error("Error leyendo users.json:", error);
        return [];
    }
};

const writeUsers = (users) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error escribiendo en users.json:", error);
    }
};

// Función de Hashing (¡Insegura comparada con bcrypt!)
// Usaremos PBKDF2 que es mejor que SHA simple, pero aún así se recomienda bcrypt.
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex'); // Generar un salt único
    // PBKDF2: Deriva una clave. Más lento que SHA simple.
    // Aumentar iteraciones (tercer argumento) lo hace más lento y seguro, pero impacta rendimiento.
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
};

// Función para verificar contraseña
const verifyPassword = (storedHash, storedSalt, providedPassword) => {
    const hashToCompare = crypto.pbkdf2Sync(providedPassword, storedSalt, 10000, 64, 'sha512').toString('hex');
    // ¡Importante usar timingSafeEqual para prevenir ataques de tiempo!
    try {
        return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hashToCompare, 'hex'));
    } catch (error) {
         // Si los buffers tienen diferente longitud, timingSafeEqual lanza error
         return false;
    }
};

// Función para parsear cookies manualmente (alternativa a cookie-parser)
const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            let parts = cookie.split('=');
            let key = parts.shift().trim();
            let value = decodeURI(parts.join('='));
            if (key) {
                cookies[key] = value;
            }
        });
    }
    return cookies;
};


// --- Rutas API ---

// Productos (igual que antes, corregido)
app.get('/api/productos', (req, res) => {
    try {
        const productosPath = path.join(__dirname, 'public', 'productos', 'productos.json');
        const productosData = fs.readFileSync(productosPath);
        res.json(JSON.parse(productosData));
    } catch (error) {
        console.error("Error al cargar productos.json:", error);
        res.status(500).json({ message: 'Error interno al cargar productos.' });
    }
});

// Registro (usando crypto)
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
    }

    const users = readUsers();
    if (users.some(user => user.username === username)) {
        return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    const { salt, hash } = hashPassword(password); // Hashear con crypto
    const newUser = {
        id: Date.now().toString(),
        username: username,
        salt: salt, // ¡Guardar el salt!
        passwordHash: hash // Guardar el hash
    };

    users.push(newUser);
    writeUsers(users);
    console.log(`Usuario registrado (con crypto): ${username}`);
    res.status(201).json({ message: 'Usuario registrado con éxito. Por favor, inicia sesión.' });
});

// Login (usando crypto y tokens manuales)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user || !user.salt || !user.passwordHash) { // Verificar que existan salt y hash
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isValid = verifyPassword(user.passwordHash, user.salt, password); // Verificar con crypto

    if (isValid) {
        // Generar un token seguro aleatorio
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + (1 * 60 * 60 * 1000); // Expira en 1 hora

        // Guardar token en nuestro 'almacén' de sesiones
        activeSessions[token] = {
            userId: user.id,
            username: user.username,
            expires: expires
        };
        writeSessions(activeSessions); // Guardar en archivo

        console.log(`Usuario inició sesión (con crypto): ${username}, Token: ${token.substring(0,8)}...`);

        // Enviar token al cliente mediante una cookie HttpOnly
        res.setHeader('Set-Cookie', `sessionToken=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`); // Max-Age en segundos (1 hora)
        res.status(200).json({ message: 'Inicio de sesión exitoso.', user: { id: user.id, username: user.username } });

    } else {
        res.status(401).json({ message: 'Credenciales inválidas.' });
    }
});

// Logout (manual)
app.post('/api/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie); // Parsear cookies manualmente
    const token = cookies.sessionToken;

    if (token && activeSessions[token]) {
        const username = activeSessions[token].username;
        delete activeSessions[token]; // Eliminar token del almacén
        writeSessions(activeSessions); // Guardar cambios en archivo
        console.log(`Usuario cerró sesión (con crypto): ${username}`);
        // Indicar al navegador que elimine la cookie
        res.setHeader('Set-Cookie', `sessionToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
        res.status(200).json({ message: 'Sesión cerrada con éxito.' });
    } else {
        res.status(400).json({ message: 'No hay sesión activa o token inválido.' });
    }
});

// Verificar Sesión (manual)
app.get('/api/session', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.sessionToken;
    const session = activeSessions[token];

    // Verificar si existe, si no ha expirado
    if (session && session.expires > Date.now()) {
         // Opcional: Refrescar la expiración de la cookie y del token si hay actividad
         session.expires = Date.now() + (1 * 60 * 60 * 1000); // Reinicia 1 hora
         activeSessions[token] = session; // Actualiza en memoria (opcional escribir a archivo aquí)
         writeSessions(activeSessions);
         res.setHeader('Set-Cookie', `sessionToken=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`);
        
        res.status(200).json({ loggedIn: true, user: { id: session.userId, username: session.username } });
    } else {
        // Si expiró, eliminarlo
        if (session) {
             delete activeSessions[token];
             writeSessions(activeSessions);
             res.setHeader('Set-Cookie', `sessionToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`); // Limpiar cookie expirada
        }
        res.status(200).json({ loggedIn: false });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor (modo inseguro - sin librerías extra) escuchando en http://localhost:${port}`);
    console.log(`Archivo de usuarios esperado en: ${usersFilePath}`);
    console.log(`Archivo de sesiones esperado en: ${sessionsFilePath}`);
    // Asegurar que los archivos existan
    readUsers();
    readSessions();
});