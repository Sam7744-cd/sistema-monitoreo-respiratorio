// ============================================
// Control para seleccionar paciente en tiempo real
// ============================================

// Guardado en RAM
let pacienteActual = null;

// App establece el paciente actual
exports.setPacienteActual = (req, res) => {
  const { pacienteId } = req.body;

  if (!pacienteId) {
    return res.status(400).json({ msg: "Falta pacienteId" });
  }

  pacienteActual = pacienteId;

  console.log("Paciente seleccionado para tiempo real:", pacienteActual);

  res.json({
    msg: "Paciente seleccionado correctamente",
    pacienteId,
  });
};

// Obtener paciente actual
exports.getPacienteActual = () => pacienteActual;
