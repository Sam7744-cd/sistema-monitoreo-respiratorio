const express = require("express");

const {
  registrar,
  login,
  loginGoogle,
  completarPerfilGoogle,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  solicitarRecuperacion,
  restablecerPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Registro e inicio de sesión local
router.post("/registrar", registrar);
router.post("/login", login);

// Inicio de sesión con Google
router.post("/google", loginGoogle);

// Completar los datos del familiar después
// del primer acceso con Google.
router.put(
  "/google/completar-perfil",
  authMiddleware,
  completarPerfilGoogle
);

// Perfil del usuario autenticado
router.get(
  "/perfil",
  authMiddleware,
  obtenerPerfil
);

router.put(
  "/perfil",
  authMiddleware,
  actualizarPerfil
);

// Cambio de contraseña desde el perfil
router.put(
  "/cambiar-password",
  authMiddleware,
  cambiarPassword
);

// Recuperación de contraseña
router.post(
  "/recuperar-password",
  solicitarRecuperacion
);

router.post(
  "/restablecer-password/:token",
  restablecerPassword
);

module.exports = router;
