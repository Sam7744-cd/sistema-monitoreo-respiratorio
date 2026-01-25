// auth.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario) {
      return res.status(401).json({
        error: 'Token inválido. Usuario no encontrado.'
      });
    }
    req.user = usuario;

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token inválido o expirado.'
    });
  }
};

module.exports = authMiddleware;
