

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;
const usersFilePath = path.join(__dirname, 'users.json');
const sessionsFilePath = path.join(__dirname, 'sessions.json');


app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




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

let activeSessions = readSessions();


const readUsers = () => {
    try {
        if (!fs.existsSync(usersFilePath)) {
            fs.writeFileSync(usersFilePath, JSON.stringify([]));
            return [];
        }
        const usersData = fs.readFileSync(usersFilePath);

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



const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');


    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
};


const verifyPassword = (storedHash, storedSalt, providedPassword) => {
    const hashToCompare = crypto.pbkdf2Sync(providedPassword, storedSalt, 10000, 64, 'sha512').toString('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hashToCompare, 'hex'));
    } catch (error) {

        return false;
    }
};


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


app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
    }

    const users = readUsers();
    if (users.some(user => user.username === username)) {
        return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    const { salt, hash } = hashPassword(password);
    const newUser = {
        id: Date.now().toString(),
        username: username,
        salt: salt,
        passwordHash: hash
    };

    users.push(newUser);
    writeUsers(users);
    console.log(`Usuario registrado (con crypto): ${username}`);
    res.status(201).json({ message: 'Usuario registrado con éxito. Por favor, inicia sesión.' });
});


app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña requeridos.' });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user || !user.salt || !user.passwordHash) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isValid = verifyPassword(user.passwordHash, user.salt, password);

    if (isValid) {

        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + (1 * 60 * 60 * 1000);


        activeSessions[token] = {
            userId: user.id,
            username: user.username,
            expires: expires
        };
        writeSessions(activeSessions);

        console.log(`Usuario inició sesión (con crypto): ${username}, Token: ${token.substring(0, 8)}...`);


        res.setHeader('Set-Cookie', `sessionToken=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`);
        res.status(200).json({ message: 'Inicio de sesión exitoso.', user: { id: user.id, username: user.username } });

    } else {
        res.status(401).json({ message: 'Credenciales inválidas.' });
    }
});


app.post('/api/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.sessionToken;

    if (token && activeSessions[token]) {
        const username = activeSessions[token].username;
        delete activeSessions[token];
        writeSessions(activeSessions);
        console.log(`Usuario cerró sesión (con crypto): ${username}`);

        res.setHeader('Set-Cookie', `sessionToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
        res.status(200).json({ message: 'Sesión cerrada con éxito.' });
    } else {
        res.status(400).json({ message: 'No hay sesión activa o token inválido.' });
    }
});


app.get('/api/session', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.sessionToken;
    const session = activeSessions[token];


    if (session && session.expires > Date.now()) {

        session.expires = Date.now() + (1 * 60 * 60 * 1000);
        activeSessions[token] = session;
        writeSessions(activeSessions);
        res.setHeader('Set-Cookie', `sessionToken=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`);

        res.status(200).json({ loggedIn: true, user: { id: session.userId, username: session.username } });
    } else {

        if (session) {
            delete activeSessions[token];
            writeSessions(activeSessions);
            res.setHeader('Set-Cookie', `sessionToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
        }
        res.status(200).json({ loggedIn: false });
    }
});


app.listen(port, () => {
    console.log(`Servidor (modo inseguro - sin librerías extra) escuchando en http://localhost:${port}`);
    console.log(`Archivo de usuarios esperado en: ${usersFilePath}`);
    console.log(`Archivo de sesiones esperado en: ${sessionsFilePath}`);

    readUsers();
    readSessions();
});