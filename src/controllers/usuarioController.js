const Usuario = require("../models/Usuario");

// GET /api/usuarios/mis-pacientes
exports.getMisPacientes = async (req, res) => {
  try {
    const usuario = await Usuario
      .findById(req.user.id)
      .populate("pacientes");

    res.json(usuario.pacientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo pacientes" });
  }
};
