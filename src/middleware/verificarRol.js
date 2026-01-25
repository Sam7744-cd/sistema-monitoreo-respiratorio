// src/middleware/verificarRol.js

module.exports = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      // authMiddleware ya puso req.user
      const { rol } = req.user;

      if (!rolesPermitidos.includes(rol)) {
        return res.status(403).json({
          error: "Acceso denegado. Rol no autorizado"
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: "Error verificando rol"
      });
    }
  };
};
