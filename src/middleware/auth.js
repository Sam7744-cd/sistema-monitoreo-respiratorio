const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware de autenticación
// Verifica que el usuario haya iniciado sesión y tenga un token válido
const authMiddleware = async (req, res, next) => {
  try {
    // Tomamos el token del header de la petición (formato: Bearer TOKEN)
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Si no hay token, negamos el acceso
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    // Verificamos que el token sea válido usando la clave secreta del entorno
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscamos el usuario correspondiente en la base de datos (sin contraseña)
    const usuario = await Usuario.findById(decoded.id).select('-password');

    // Si no se encuentra, bloqueamos la solicitud
    if (!usuario) {
      return res.status(401).json({ 
        error: 'Token inválido. Usuario no encontrado.' 
      });
    }

    // Añadimos el usuario al objeto request para que esté disponible en las rutas
    req.usuario = usuario;

    // Continuamos con la ejecución de la siguiente función o ruta
    next();
  } catch (error) {
    // Si el token es inválido o expiró
    res.status(401).json({ 
      error: 'Token inválido o expirado.' 
    });
  }
};

module.exports = authMiddleware;
