// Rutas relacionadas con autenticación de usuarios (registro, login, perfil)

const express = require('express');
const { registrar, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const {registrar,login,actualizarPerfil,cambiarPassword} = require('../controllers/authController');
const router = express.Router();

// Ruta para registrar un nuevo usuario
// Esta se utiliza para médicos, familiares o admin según el rol
router.post('/registrar', registrar);

// Ruta para iniciar sesión (login)
// Devuelve un token JWT si las credenciales son válidas
router.post('/login', login);

// Ruta protegida que permite ver el perfil del usuario autenticado
// Se requiere enviar el token JWT en el header Authorization
router.get('/perfil', authMiddleware, (req, res) => {
  res.json({
    mensaje: 'Perfil del usuario',
    usuario: req.usuario // Esto viene del middleware de autenticación
  });
});

router.put('/perfil', authMiddleware, actualizarPerfil);
router.put('/cambiar-password', authMiddleware, cambiarPassword);


module.exports = router;
