const MedicionTiempoReal = require("../models/medicionTiempoReal");
const { getPacienteActual } = require("./tiempoRealSeleccionController");

// ============================================
// Calcular diagnóstico según ruido
// ============================================
function calcularDiagnostico(ruido) {
  if (ruido < -65) return "Normal";
  if (ruido < -50) return "Asma";
  return "Bronquitis";
}

// ============================================
// Recibir medición del ESP32
// ============================================
exports.recibirMedicion = async (req, res) => {
  try {
    const pacienteSeleccionado = getPacienteActual();

    if (!pacienteSeleccionado) {
      return res.status(400).json({
        msg: "No se ha seleccionado un paciente desde la app",
      });
    }

    const { movX, movY, movZ, ruido } = req.body;

    const diagnostico = calcularDiagnostico(ruido);

    const medicion = await MedicionTiempoReal.create({
      paciente: pacienteSeleccionado,
      movX,
      movY,
      movZ,
      ruido,
      diagnostico,
      alerta: diagnostico === "Bronquitis",
    });

    res.json(medicion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al guardar la medición" });
  }
};

// ============================================
// Obtener última medición (para app)
// ============================================
exports.obtenerActual = async (req, res) => {
  try {
    const ultima = await MedicionTiempoReal.findOne()
      .sort({ createdAt: -1 })
      .populate("paciente");

    if (!ultima) return res.json({ msg: "No hay datos aún" });

    res.json({
      paciente: ultima.paciente._id,
      movX: ultima.movX,
      movY: ultima.movY,
      movZ: ultima.movZ,
      ruido: ultima.ruido,
      diagnostico: ultima.diagnostico,
      alerta: ultima.alerta,
      timestamp: ultima.createdAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener datos" });
  }
};
