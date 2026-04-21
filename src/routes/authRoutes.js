const express = require("express");

const {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/registrar", registrar);
router.post("/login", login);

router.get("/perfil", authMiddleware, obtenerPerfil);
router.put("/perfil", authMiddleware, actualizarPerfil);
router.put("/cambiar-password", authMiddleware, cambiarPassword);

module.exports = router;