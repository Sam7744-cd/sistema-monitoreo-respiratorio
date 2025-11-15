// Aquí configuro las rutas que se usarán para manejar alertas en el sistema.
// Las rutas se conectan con las funciones del controlador de alertas.

const express = require('express');
const router = express.Router();

// Importo las funciones del controlador de alertas
const {
  crearAlerta,
  obtenerAlertas,
  marcarLeida
} = require('../controllers/alertaController');

// middleware para verificar que el usuario esté autenticado
const authMiddleware = require('../middleware/auth');

// Todas las rutas están protegidas y requieren token
router.use(authMiddleware);

// Ruta para crear una alerta (puede venir desde el sistema o desde el backend directamente)
router.post('/', crearAlerta);

// Ruta para obtener todas las alertas de un paciente específico
router.get('/paciente/:pacienteId', obtenerAlertas);

// Ruta para marcar una alerta como leída
router.patch('/:alertaId/leida', marcarLeida);

module.exports = router;
