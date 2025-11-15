const express = require('express');
const {
  crearPaciente,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente
} = require('../controllers/pacienteController');

const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roles');

const router = express.Router();

// Todas las rutas están protegidas, requieren que el usuario esté autenticado
router.use(authMiddleware);

// Ruta para que los médicos (o admins) registren un nuevo paciente
router.post('/', roleMiddleware(['medico', 'admin']), crearPaciente);

// Ruta para obtener todos los pacientes relacionados al usuario (según rol)
router.get('/', roleMiddleware(['medico', 'familiar', 'admin']), obtenerPacientes);

// Ruta para obtener un solo paciente por ID (con acceso según rol)
router.get('/:id', roleMiddleware(['medico', 'familiar', 'admin']), obtenerPaciente);

// Ruta para que el médico asocie un familiar al paciente
router.post('/:pacienteId/familiares', roleMiddleware(['medico', 'admin']), agregarFamiliar);

// Obtener resumen clínico de un paciente
router.get('/:id/resumen', roleMiddleware(['medico', 'familiar', 'admin']), obtenerResumenPaciente);


module.exports = router;
