const express = require("express");

const {
  inicializarPrincipal,
  obtenerPrincipal,
  listarDispositivos,
  actualizarPrincipal,
  registrarConexion,
} = require("../controllers/dispositivoController");

const authMiddleware =
  require("../middleware/auth");

const router = express.Router();

// El ESP32 puede informar que está conectado
// sin necesitar una sesión de usuario.
router.post(
  "/heartbeat",
  registrarConexion
);

// Consultas administrativas y médicas.
router.post(
  "/inicializar",
  authMiddleware,
  inicializarPrincipal
);

router.get(
  "/principal",
  authMiddleware,
  obtenerPrincipal
);

router.get(
  "/",
  authMiddleware,
  listarDispositivos
);

router.put(
  "/principal",
  authMiddleware,
  actualizarPrincipal
);

module.exports = router;
