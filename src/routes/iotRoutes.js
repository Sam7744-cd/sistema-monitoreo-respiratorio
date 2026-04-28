const express = require("express");
const multer = require("multer");

const {
  setPacienteActivo,
  getPacienteActivo,
  iotAudio,
  proxyArchivoML,
} = require("../controllers/iotController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Selección de paciente desde la app / Postman
router.post("/set-paciente", setPacienteActivo);
router.get("/paciente-activo", getPacienteActivo);

// Audio real desde ESP32
router.post("/audio", upload.single("file"), iotAudio);

// Proxy para mostrar audio, waveform y espectrograma del ML
router.get("/proxy-ml", proxyArchivoML);

module.exports = router;