const express = require("express");
const router = express.Router();

const {
  recibirMedicion,
  obtenerActual
} = require("../controllers/medicionTiempoRealController");

const {
  setPacienteActual
} = require("../controllers/tiempoRealSeleccionController");

//     1) ESP32 ENVÍA DATOS --> NO debe requerir token
router.post("/", recibirMedicion);

//     2) APP SELECCIONA PACIENTE 
router.post("/set-paciente", setPacienteActual);


//     3) OBTENER ÚLTIMA MEDICIÓN 
router.get("/actual", obtenerActual);

module.exports = router;
