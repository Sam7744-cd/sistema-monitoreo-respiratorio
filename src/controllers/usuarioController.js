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

// POST /api/usuarios/asociar-paciente
exports.asociarPaciente = async (req, res) => {
  try {
    const { pacienteId, familiarId } = req.body;

    if (!pacienteId || !familiarId) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const familiar = await Usuario.findById(familiarId);

    if (!familiar || familiar.rol !== "familiar") {
      return res.status(404).json({ error: "Familiar no válido" });
    }

    // Evitar duplicados
    if (!familiar.pacientes.includes(pacienteId)) {
      familiar.pacientes.push(pacienteId);
      await familiar.save();
    }

    res.json({ mensaje: "Paciente asociado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error asociando paciente" });
  }
};
