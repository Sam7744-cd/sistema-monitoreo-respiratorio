const express = require("express");
const {
  crearPaciente,
  obtenerPacientes,
  obtenerPaciente,
  listarAsociaciones,
  agregarFamiliar,
  quitarFamiliar,
  actualizarPaciente,
  eliminarPaciente,
} = require("../controllers/pacienteController");

const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roles");

const router = express.Router();

router.use(authMiddleware);

// Crear paciente
router.post("/", roleMiddleware(["medico", "admin"]), crearPaciente);

//  asociaciones primero
router.get(
  "/asociaciones",
  roleMiddleware(["medico", "admin"]),
  listarAsociaciones
);

// Asociar familiar
router.post(
  "/:pacienteId/familiares",
  roleMiddleware(["medico", "admin"]),
  agregarFamiliar
);

// Desvincular familiar
router.delete(
  "/:pacienteId/familiares/:familiarId",
  roleMiddleware(["medico", "admin"]),
  quitarFamiliar
);

// Listar pacientes
router.get("/", roleMiddleware(["medico", "familiar", "admin"]), obtenerPacientes);

//  esta SIEMPRE abajo de /asociaciones
router.get("/:id", roleMiddleware(["medico", "familiar", "admin"]), obtenerPaciente);

// Actualizar paciente
router.put("/:id", roleMiddleware(["medico", "admin"]), actualizarPaciente);

// Eliminar paciente
router.delete("/:id", roleMiddleware(["medico", "admin"]), eliminarPaciente);

module.exports = router;