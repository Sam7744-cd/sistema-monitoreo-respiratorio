const express = require("express");
const router = express.Router();

const {
  recibirMedicion,
  obtenerActual
} = require("../controllers/medicionTiempoRealController");

router.post("/", recibirMedicion); // ESP32 envía aquí
router.get("/actual", obtenerActual); // App consulta aquí

module.exports = router;
