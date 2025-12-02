const express = require("express");
const router = express.Router();

const {
  recibirMedicion,     // ESP32 envía mediciones
  obtenerActual        // App obtiene última medición
} = require("../controllers/medicionTiempoRealController");

const {
  setPacienteActual    // App selecciona paciente actual
} = require("../controllers/tiempoRealSeleccionController");

// Middlewares
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/roles");

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ESP32 envía datos en tiempo real
router.post("/", recibirMedicion);

// App selecciona paciente para monitoreo
// Médico y Familiar

router.post(
  "/set-paciente",
  roleMiddleware(["medico", "familiar"]),
  setPacienteActual
);

// Obtener última medición del paciente seleccionado
// (lo pueden ver tanto médico como familiar)
router.get("/actual", obtenerActual);

module.exports = router;

