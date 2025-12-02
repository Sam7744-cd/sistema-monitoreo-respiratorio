// -------------------------------------------------------------
// pacienteRoutes.js - Versión corregida y 100% funcional
// -------------------------------------------------------------

const express = require('express');

// Importo TODOS los controladores necesarios
const {
  crearPaciente,
  registrarConFamiliar,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente,
  asociarPorCedula   
} = require('../controllers/pacienteController');

const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roles');
const Paciente = require("../models/Paciente");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);


// Registrar paciente SOLO 
router.post('/', roleMiddleware(['medico', 'admin']), crearPaciente);


// Registrar paciente + familiar (este lo agg recien)
router.post(
  "/registrar-con-familiar",
  roleMiddleware(["medico", "admin"]),
  registrarConFamiliar
);


// Obtener todos los pacientes del usuario logueado
router.get('/', roleMiddleware(['medico', 'familiar', 'admin']), obtenerPacientes);


// Obtener un paciente por ID
router.get('/:id', roleMiddleware(['medico', 'familiar', 'admin']), obtenerPaciente);


// Asociar familiar manualmente por ID
router.post('/:pacienteId/familiares', roleMiddleware(['medico', 'admin']), agregarFamiliar);


// Resumen del paciente
router.get('/:id/resumen', roleMiddleware(['medico', 'familiar', 'admin']), obtenerResumenPaciente);

// Asociar familiar a paciente usando CÉDULAS
router.post(
  "/asociar-cedula",
  roleMiddleware(["medico", "admin"]),
  asociarPorCedula   // ← AHORA SÍ EXISTE Y FUNCIONA
);

module.exports = router;
