//mediciones routes 
const express = require("express");
const multer = require("multer");

const {
  crearMedicion,
  obtenerHistorial,
  obtenerEstadisticas,
  obtenerResumen,
  clasificarYGuardar,
  iotAudio,
  actualizarMedicion,
  eliminarMedicion,
} = require("../controllers/medicionController");

const authMiddleware = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Rutas protegidas para app / Postman con login
router.use(authMiddleware);

router.post("/", crearMedicion);
router.post("/clasificar-y-guardar", upload.single("file"), clasificarYGuardar);

router.get("/paciente/:pacienteId/resumen", obtenerResumen);
router.get("/paciente/:pacienteId/historial", obtenerHistorial);
router.get("/paciente/:pacienteId/estadisticas", obtenerEstadisticas);

// Ruta especial para IoT
// Por ahora la dejamos aquí protegida con token
router.post("/iot-audio", upload.single("file"), iotAudio);
router.put("/:id", actualizarMedicion);
router.delete("/:id", eliminarMedicion);

module.exports = router;