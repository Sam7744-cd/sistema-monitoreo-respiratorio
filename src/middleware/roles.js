// Middleware para controlar el acceso a rutas según el rol del usuario
const roleMiddleware = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // Verificar que el authMiddleware ya haya puesto el usuario
      if (!req.usuario) {
        return res.status(401).json({
          error: 'Usuario no autenticado'
        });
      }

      // Verificar rol correctamente
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({
          error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(', ')}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'Error verificando roles: ' + error.message
      });
    }
  };
};

module.exports = roleMiddleware;
