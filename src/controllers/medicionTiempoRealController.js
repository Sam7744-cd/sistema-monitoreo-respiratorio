const MedicionTiempoReal = require("../models/medicionTiempoReal");
const { getPacienteActual } = require("./tiempoRealSeleccionController");
const MedicionHistorica = require("../models/MedicionHistorica");
const { classify } = require("../analysis/classifier");


// RECIBIR MEDICIÓN DEL ESP32
exports.recibirMedicion = async (req, res) => {
  try {
    const pacienteId = getPacienteActual();

    if (!pacienteId) {
      return res.status(400).json({
        msg: "No se ha seleccionado un paciente desde la app",
      });
    }

    const data = req.body;

    const safe = {
      movX: data.movX ?? 0,
      movY: data.movY ?? 0,
      movZ: data.movZ ?? 0,

      ruido: data.ruido ?? 0,
      rms: data.rms ?? 0,
      zcr: data.zcr ?? 0,
      spectral_centroid: data.spectral_centroid ?? 0,

      audio_fft: data.audio_fft ?? []
    };

    // CLASIFICACIÓN REAL SIN IFs DE DECISIÓN
    const diagnostico = classify(safe);

    // Guardar última medición (para la app)
    const medicion = await MedicionTiempoReal.create({
      paciente: pacienteId,

      movX: safe.movX,
      movY: safe.movY,
      movZ: safe.movZ,

      ruido: safe.ruido,
      rms: safe.rms,
      zcr: safe.zcr,
      spectral_centroid: safe.spectral_centroid,

      audio_fft: safe.audio_fft,

      diagnostico,
      alerta: diagnostico !== "normal"
    });

    // Guardar histórico (dataset)
    await MedicionHistorica.create({
      paciente: pacienteId,

      movX: safe.movX,
      movY: safe.movY,
      movZ: safe.movZ,

      ruido: safe.ruido,
      rms: safe.rms,
      zcr: safe.zcr,
      spectral_centroid: safe.spectral_centroid,

      audio_fft: safe.audio_fft,
      diagnostico: "por determinar"
    });

    return res.json(medicion);

  } catch (error) {
    console.log("ERROR RECIBIR MEDICION:", error);
    return res.status(500).json({ msg: "Error al guardar medición" });
  }
};


// OBTENER ÚLTIMA MEDICIÓN PARA MOSTRAR EN TIEMPO REAL
exports.obtenerActual = async (req, res) => {
  try {
    const pacienteId = getPacienteActual();

    if (!pacienteId) {
      return res.status(400).json({ msg: "No hay paciente seleccionado" });
    }

    const ultima = await MedicionTiempoReal.findOne({ paciente: pacienteId })
      .sort({ createdAt: -1 });

    if (!ultima) {
      return res.json({ msg: "No hay datos aún" });
    }

    return res.json({
      paciente: ultima.paciente,
      movX: ultima.movX,
      movY: ultima.movY,
      movZ: ultima.movZ,
      ruido: ultima.ruido,
      rms: ultima.rms,
      zcr: ultima.zcr,
      spectral_centroid: ultima.spectral_centroid,
      audio_fft: ultima.audio_fft ?? [],
      diagnostico: ultima.diagnostico,
      alerta: ultima.alerta,
      timestamp: ultima.createdAt,
    });

  } catch (error) {
    console.log("ERROR obtenerActual:", error);
    return res.status(500).json({ msg: "Error al obtener datos" });
  }
};
