const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");

exports.asociarPaciente = async (req, res) => {
  try {
    const { pacienteId, familiarId } = req.body;

    // validar existencia
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const familiar = await Usuario.findById(familiarId);
    if (!familiar || familiar.rol !== "familiar") {
      return res.status(400).json({ error: "Familiar inválido" });
    }

    // evitar duplicados
    if (familiar.pacientes.includes(pacienteId)) {
      return res.status(400).json({ error: "Paciente ya asociado" });
    }

    familiar.pacientes.push(pacienteId);
    await familiar.save();

    res.json({
      mensaje: "Paciente asociado correctamente",
      pacienteId,
      familiarId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al asociar paciente" });
  }
};
