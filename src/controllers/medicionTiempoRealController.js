const MedicionTiempoReal = require("../models/medicionTiempoReal");

// ============================================================
//  Cálculo del diagnóstico en BACKEND
// ============================================================
function calcularDiagnostico(ruido) {
  if (ruido < 56) return "Normal";
  if (ruido < 71) return "Asma";
  if (ruido < 83) return "Bronquitis";
  return "Neumonía";
}

function calcularAlerta(ruido) {
  return ruido >= 83; // true si neumonía
}

// ============================================================
//  Recibir medición del ESP32 (POST)
// ============================================================
exports.recibirMedicion = async (req, res) => {
  try {
    const { paciente, movX, movY, movZ, ruido } = req.body;

    if (!paciente) {
      return res.status(400).json({ msg: "Falta el ID del paciente" });
    }

    const diagnostico = calcularDiagnostico(ruido);
    const alerta = calcularAlerta(ruido);

    const medicion = await MedicionTiempoReal.create({
      paciente,
      movX,
      movY,
      movZ,
      ruido,
      diagnostico,
      alerta
    });

    res.json(medicion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al guardar la medición" });
  }
};

// ============================================================
//  Última medición (GET) para la app
// ============================================================
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
      timestamp: ultima.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener datos" });
  }
};
