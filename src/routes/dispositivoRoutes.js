// Rutas para manejar dispositivos IoT en el sistema

const express = require('express');
const router = express.Router();

// Controlador
const {
  registrarDispositivo,
  obtenerDispositivo
} = require('../controllers/dispositivoController');

// Middleware de autenticación
const authMiddleware = require('../middleware/auth');
router.use(authMiddleware);

// Ruta para registrar un nuevo dispositivo
router.post('/', registrarDispositivo);

// Ruta para obtener el dispositivo asociado a un paciente
router.get('/paciente/:pacienteId', obtenerDispositivo);

module.exports = router;
