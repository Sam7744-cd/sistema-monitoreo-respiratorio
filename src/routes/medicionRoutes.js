//enrutador para manejar las rutas de mediciones
const express = require('express');
const {
  crearMedicion,
  obtenerHistorial,
  obtenerEstadisticas
} = require('../controllers/medicionController');

//Middleware de autenticación para proteger las rutas
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de esta sección requieren que el usuario esté autenticado
router.use(authMiddleware);

// Ruta para registrar una nueva medición desde el dispositivo o la app
router.post('/', crearMedicion);

// Ruta para obtener el historial completo de mediciones de un paciente
router.get('/paciente/:pacienteId/historial', obtenerHistorial);

// Ruta para obtener estadísticas de un paciente (por ejemplo, promedios)
router.get('/paciente/:pacienteId/estadisticas', obtenerEstadisticas);

module.exports = router;
