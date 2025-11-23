const express = require("express");
const router = express.Router();

const {
  recibirMedicion,
  obtenerActual,
} = require("../controllers/medicionTiempoRealController");

const {
  setPacienteActual,
} = require("../controllers/tiempoRealSeleccionController");

// ESP32 manda datos
router.post("/", recibirMedicion);

// App selecciona paciente
router.post("/set-paciente", setPacienteActual);

// App consulta última medición
router.get("/actual", obtenerActual);

module.exports = router;
