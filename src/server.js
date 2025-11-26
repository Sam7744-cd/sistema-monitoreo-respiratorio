// Archivo principal del servidor Express para el backend del sistema
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database.js');

// Conectar a MongoDB
connectDB();

const app = express();
//rutas relacionadas con el análisis de audio
const analysisRoutes = require('./routes/analysisRoutes');

// MIDDLEWARES GLOBALES
// Configuro CORS para permitir peticiones desde cualquier origen
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'] }));
// Helmet agrega cabeceras de seguridad
app.use(helmet());
app.use(express.json({ limit: '10mb' })); // permite JSON grande (base64)

// Rutas principales
app.use('/api/auth', require('./routes/authRoutes')); // Registro y login
app.use('/api/pacientes', require('./routes/pacienteRoutes')); // Gestión de pacientes
app.use('/api/mediciones', require('./routes/medicionRoutes')); // Registro y consulta de mediciones
app.use('/api/analysis', analysisRoutes); // Procesamiento y análisis de audio
app.use('/api/alertas', require('./routes/alertaRoutes')); // Alwrtas medicas (se usan para guardar y consultar alertas generadas por las mediciones)
app.use('/api/reportes', require('./routes/reporteRoutes')); //reportes medicos
app.use('/api/dispositivos', require('./routes/dispositivoRoutes')); // registrar o consultar dispositivos
app.use("/api/usuarios", require("./routes/usuarioRoutes")); //traer paciente 

//Ruta tiempo real
app.use('/api/tiempo-real', require('./routes/medicionTiempoRealRoutes'));

// Ruta de salud del servidor (puede usarse para pruebas o monitoreo)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: ' Servidor funcionando', 
    database: 'Conectado a MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});


// Middleware para manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3680;
// Levanto el servidor en el puerto definido en .env o por defecto en 3680
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor escuchando externamente en el puerto ${PORT}`);
});



