// Middleware para controlar el acceso a rutas según el rol del usuario

const roleMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // Si no hay usuario autenticado (no pasó por el authMiddleware)
      if (!req.usuario) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        });
      }

      // Si el rol del usuario no está entre los permitidos
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(', ')}`
        });
      }

      // El usuario tiene el rol correcto, se permite continuar
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Error verificando roles: ' + error.message
      });
    }
  };
};

module.exports = roleMiddleware;
