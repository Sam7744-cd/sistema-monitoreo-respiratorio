const MedicionTiempoReal = require("../models/medicionTiempoReal");
const { getPacienteActual } = require("./tiempoRealSeleccionController");
const { analizarRespiracion } = require("../analysisR/detectorRespiratorio");

// ------------------------------------------------------
// Recibir medición desde ESP32
// ------------------------------------------------------
exports.recibirMedicion = async (req, res) => {
  try {
    const pacienteId = getPacienteActual();

    if (!pacienteId) {
      return res.status(400).json({
        msg: "No se ha seleccionado un paciente desde la app",
      });
    }

    const data = req.body;

    // VALIDACIÓN mínima para evitar "undefined"
    const safe = {
      movX: data.movX ?? 0,
      movY: data.movY ?? 0,
      movZ: data.movZ ?? 0,

      ruido: data.ruido ?? 0,
      rms: data.rms ?? 0,
      zcr: data.zcr ?? 0,
      spectral_centroid: data.spectral_centroid ?? 0,
      wheeze_ratio: data.wheeze_ratio ?? 0,
      roncus_ratio: data.roncus_ratio ?? 0,
    };

    // 1. Analizar características respiratorias
    const diagnostico = analizarRespiracion(safe);

    // 2. Guardar en la BD
    const medicion = await MedicionTiempoReal.create({
      paciente: pacienteId,

      movX: safe.movX,
      movY: safe.movY,
      movZ: safe.movZ,

      ruido: safe.ruido,
      rms: safe.rms,
      zcr: safe.zcr,
      spectral_centroid: safe.spectral_centroid,
      wheeze_ratio: safe.wheeze_ratio,
      roncus_ratio: safe.roncus_ratio,

      diagnostico,
      alerta: diagnostico !== "Normal",
    });

    return res.json(medicion);

  } catch (error) {
    console.log("ERROR RECIBIR MEDICION:", error);
    return res.status(500).json({ msg: "Error al guardar medición" });
  }
};

// ------------------------------------------------------
// Obtener última medición
// ------------------------------------------------------
exports.obtenerActual = async (req, res) => {
  try {
    const ultima = await MedicionTiempoReal.findOne()
      .sort({ createdAt: -1 })
      .populate("paciente");

    if (!ultima) {
      return res.json({ msg: "No hay datos aún" });
    }

    return res.json({
      paciente: ultima.paciente._id,

      movX: ultima.movX,
      movY: ultima.movY,
      movZ: ultima.movZ,

      ruido: ultima.ruido,
      rms: ultima.rms,
      zcr: ultima.zcr,
      spectral_centroid: ultima.spectral_centroid,
      wheeze_ratio: ultima.wheeze_ratio,
      roncus_ratio: ultima.roncus_ratio,

      diagnostico: ultima.diagnostico,
      alerta: ultima.alerta,

      timestamp: ultima.createdAt,
    });

  } catch (error) {
    console.log("ERROR obtenerActual:", error);
    return res.status(500).json({ msg: "Error al obtener datos" });
  }
};
