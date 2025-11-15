// Importo Express para poder definir rutas
const express = require('express');
const router = express.Router();

// Importo el middleware de autenticación (verifica el token)
const authMiddleware = require('../middleware/auth');

// Importo las funciones del controlador de reportes
const {
  crearReporte,
  obtenerReportesPorPaciente
} = require('../controllers/reporteController');

// Aplico el middleware a todas las rutas para que requieran autenticación
router.use(authMiddleware);

// Ruta para crear un nuevo reporte (solo para médicos)
router.post('/', crearReporte);

// Ruta para obtener todos los reportes de un paciente
router.get('/paciente/:pacienteId', obtenerReportesPorPaciente);

// Exporto el router para poder usarlo en server.js
module.exports = router;
