// Rutas relacionadas con autenticación de usuarios (registro, login, perfil)

const express = require('express');

const {
  registrar,
  login,
  actualizarPerfil,
  cambiarPassword
} = require('../controllers/authController');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Registro de usuario
router.post('/registrar', registrar);

// Login
router.post('/login', login);

// Ver perfil (protegida)
router.get('/perfil', authMiddleware, (req, res) => {
  res.json({
    mensaje: 'Perfil del usuario',
    usuario: req.usuario
  });
});

// Actualizar perfil
router.put('/perfil', authMiddleware, actualizarPerfil);

// Cambiar contraseña
router.put('/cambiar-password', authMiddleware, cambiarPassword);

module.exports = router;
