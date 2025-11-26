const express = require('express');
const {
  crearPaciente,
  registrarConFamiliar,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente
} = require('../controllers/pacienteController');

const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roles');
const Paciente = require("../models/Paciente");

const router = express.Router();

// Todas las rutas están protegidas, requieren autenticación
router.use(authMiddleware);

// -------------------------------------------------------------
// Registrar paciente SOLO (viejo)
// -------------------------------------------------------------
router.post('/', roleMiddleware(['medico', 'admin']), crearPaciente);

// -------------------------------------------------------------
// NUEVA RUTA: Registrar paciente + familiar
// -------------------------------------------------------------
router.post(
  "/registrar-con-familiar",
  roleMiddleware(["medico", "admin"]),
  registrarConFamiliar
);

// -------------------------------------------------------------
// Obtener todos los pacientes del usuario
// -------------------------------------------------------------
router.get('/', roleMiddleware(['medico', 'familiar', 'admin']), obtenerPacientes);

// -------------------------------------------------------------
// Obtener paciente por ID
// -------------------------------------------------------------
router.get('/:id', roleMiddleware(['medico', 'familiar', 'admin']), obtenerPaciente);

// -------------------------------------------------------------
// Asociar familiar manualmente (opcional)
// -------------------------------------------------------------
router.post('/:pacienteId/familiares', roleMiddleware(['medico', 'admin']), agregarFamiliar);

// -------------------------------------------------------------
// Resumen del paciente
// -------------------------------------------------------------
router.get('/:id/resumen', roleMiddleware(['medico', 'familiar', 'admin']), obtenerResumenPaciente);

// -------------------------------------------------------------
// Asignar medico (temporal)
// -------------------------------------------------------------
router.put(
  "/asignar-medico/:id",
  roleMiddleware(['admin', 'medico']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { medicoId } = req.body;

      const paciente = await Paciente.findByIdAndUpdate(
        id,
        { medico: medicoId },
        { new: true }
      );

      if (!paciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      res.json({
        mensaje: "Médico asignado correctamente",
        paciente
      });
    } catch (error) {
      res.status(500).json({ error: "Error asignando médico" });
    }
  }
);

// -------------------------------------------------------------
// ASOCIAR FAMILIAR A PACIENTE POR CÉDULA
// -------------------------------------------------------------
router.post(
  "/asociar-cedula",
  roleMiddleware(["medico", "admin"]),
  asociarPorCedula
);


module.exports = router;
