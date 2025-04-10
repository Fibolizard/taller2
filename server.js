

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose'); // Importar Mongoose


const app = express();
const port = 3000;
const usersFilePath = path.join(__dirname, 'users.json');
const sessionsFilePath = path.join(__dirname, 'sessions.json');
const Product = require('./models/productos.js'); // Importar el modelo de Producto
const CompanyInfo = require('./models/companyInfo.js'); // Importar el modelo de CompanyInfo


app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const dbUri = 'mongodb+srv://juanestebanurreac:52Fq49TaMX8zthYx@cluster1.qd9ikt7.mongodb.net/?retryWrites=true&w=majority&appName=cluster1'; // Reemplaza con tu URI de conexión a MongoDB Atlas o local
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));




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

// --- Rutas API ---

// **Rutas de Productos (CRUD)**

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Product.find(); // Usar el modelo Product para consultar MongoDB
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
});

// Crear un nuevo producto
app.post('/api/productos', async (req, res) => {
    const producto = new Product(req.body); // Crear una instancia del modelo Product con los datos del cuerpo de la petición
    try {
        const nuevoProducto = await producto.save(); // Guardar en MongoDB
        res.status(201).json(nuevoProducto); // 201 Created
    } catch (error) {
        res.status(400).json({ message: 'Error al crear producto', error: error.message }); // 400 Bad Request
    }
});

// Actualizar un producto (por ID)
app.put('/api/productos/:id', async (req, res) => {
    try {
        const productoActualizado = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); // { new: true } para retornar el documento actualizado
        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado' }); // 404 Not Found
        }
        res.json(productoActualizado);
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar producto', error: error.message });
    }
});

 
// Eliminar un producto (por ID)
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const productoEliminado = await Product.findByIdAndDelete(req.params.id);
        if (!productoEliminado) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
    }
});


// **Rutas de Información de la Empresa (CRUD básico si es necesario, o solo lectura)**
app.get('/api/company-info', async (req, res) => {
    try {
        const info = await CompanyInfo.findOne(); // Asumiendo que solo hay un documento de info, o quieres el primero
        res.json(info);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener información de la empresa', error: error.message });
    }
});





app.listen(port, () => {
    console.log(`Servidor (modo inseguro - sin librerías extra) escuchando en http://localhost:${port}`);
    console.log(`Archivo de usuarios esperado en: ${usersFilePath}`);
    console.log(`Archivo de sesiones esperado en: ${sessionsFilePath}`);

    readUsers();
    readSessions();
});