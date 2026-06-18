const fs = require("fs");
const path = require("path");
const Medicion = require("../models/medicion");
const Paciente = require("../models/Paciente");
const axios = require("axios");
const FormData = require("form-data");

// helpers
function parseDateStart(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return null;
  return new Date(`${yyyy_mm_dd}T00:00:00.000`);
}

function parseDateEnd(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return null;
  return new Date(`${yyyy_mm_dd}T23:59:59.999`);
}

function std(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5001";

// Carpeta donde se guardarán los audios originales del backend
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Crear medición manual
const crearMedicion = async (req, res) => {
  try {
    const {
      pacienteId,
      frecuencia_respiratoria,
      ruido,
      sibilancias,
      roncus,
      resultado,
      features,
      acelerometro,
      timestamp,
      audio_filename,
      audio_url,
      ruta_audio,
      clase_guardada,
    } = req.body;

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const nuevaMedicion = new Medicion({
      paciente: pacienteId,
      frecuencia_respiratoria,
      ruido,
      sibilancias,
      roncus,
      resultado,
      features,
      acelerometro,
      audio_filename: audio_filename || null,
      audio_url: audio_url || null,
      ruta_audio: ruta_audio || null,
      clase_guardada: clase_guardada || null,
      timestamp: timestamp || new Date(),
    });

    await nuevaMedicion.save();

    res.status(201).json({
      mensaje: "Medición registrada exitosamente",
      medicion: nuevaMedicion,
    });
  } catch (error) {
    res.status(500).json({ error: "Error creando medición: " + error.message });
  }
};

// Historial
const obtenerHistorial = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const mediciones = await Medicion.find({ paciente: pacienteId }).sort({
      createdAt: -1,
    });

    res.json(mediciones);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo historial: " + error.message });
  }
};

// Estadísticas básicas
const obtenerEstadisticas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const mediciones = await Medicion.find({ paciente: pacienteId });

    if (mediciones.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay mediciones registradas para este paciente" });
    }

    const total = mediciones.length;
    const promedioFR =
      mediciones.reduce((sum, m) => sum + (m.frecuencia_respiratoria || 0), 0) / total;

    const porcentajeSibilancias =
      (mediciones.filter((m) => (m.sibilancias || 0) > 0).length / total) * 100;
    const porcentajeRoncus =
      (mediciones.filter((m) => (m.roncus || 0) > 0).length / total) * 100;

    res.json({
      totalMediciones: total,
      promedioFrecuenciaRespiratoria: Number(promedioFR.toFixed(2)),
      porcentajeSibilancias: Number(porcentajeSibilancias.toFixed(2)),
      porcentajeRoncus: Number(porcentajeRoncus.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo estadísticas: " + error.message });
  }
};

// Resumen clínico
const obtenerResumen = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { desde, hasta } = req.query;

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const filtro = { paciente: pacienteId };

    const d1 = parseDateStart(desde);
    const d2 = parseDateEnd(hasta);
    if (d1 || d2) {
      filtro.createdAt = {};
      if (d1) filtro.createdAt.$gte = d1;
      if (d2) filtro.createdAt.$lte = d2;
    }

    const mediciones = await Medicion.find(filtro).sort({ createdAt: 1 });

    if (mediciones.length === 0) {
      return res.json({
        total: 0,
        promedioFR: 0,
        minFR: 0,
        maxFR: 0,
        variabilidadFR: 0,
        promedioRuido: 0,
        maxRuido: 0,
        alertasPeriodo: 0,
        diagnosticos: {
          Normal: 0,
          Asma: 0,
          Bronquitis: 0,
          "por determinar": 0,
        },
        scoreRiesgo: 0,
        nivelRiesgo: "Bajo",
      });
    }

    const fr = mediciones
      .map((m) => Number(m.frecuencia_respiratoria || 0))
      .filter((x) => x > 0);

    const ruidoArr = mediciones
      .map((m) => Number(m.ruido || 0))
      .filter((x) => x !== 0);

    const promedioFR = fr.reduce((a, b) => a + b, 0) / (fr.length || 1);
    const minFR = fr.length ? Math.min(...fr) : 0;
    const maxFR = fr.length ? Math.max(...fr) : 0;
    const variabilidadFR = std(fr);

    const promedioRuido = ruidoArr.length
      ? ruidoArr.reduce((a, b) => a + b, 0) / ruidoArr.length
      : 0;

    const maxRuido = ruidoArr.length ? Math.max(...ruidoArr) : 0;

    const diagnosticos = {
      Normal: 0,
      Asma: 0,
      Bronquitis: 0,
      "por determinar": 0,
    };

    mediciones.forEach((m) => {
      const tipo =
        m.resultado && m.resultado.tipo ? m.resultado.tipo : "por determinar";
      diagnosticos[tipo] = (diagnosticos[tipo] || 0) + 1;
    });

    let alertasPeriodo = 0;
    mediciones.forEach((m) => {
      const frv = Number(m.frecuencia_respiratoria || 0);
      const r = Number(m.ruido || 0);
      const sib = Number(m.sibilancias || 0);
      const ron = Number(m.roncus || 0);

      const alerta = frv >= 30 || r >= -55 || sib >= 1 || ron >= 1;
      if (alerta) alertasPeriodo++;
    });

    let score =
      promedioFR * 2 +
      variabilidadFR * 6 +
      alertasPeriodo * 2 +
      (maxRuido ? Math.max(0, -50 - maxRuido) * 0.5 : 0);

    score = clamp(score, 0, 100);

    const nivelRiesgo = score >= 70 ? "Alto" : score >= 40 ? "Medio" : "Bajo";

    res.json({
      total: mediciones.length,
      promedioFR: Number(promedioFR.toFixed(2)),
      minFR,
      maxFR,
      variabilidadFR: Number(variabilidadFR.toFixed(2)),
      promedioRuido: Number(promedioRuido.toFixed(2)),
      maxRuido,
      alertasPeriodo,
      diagnosticos,
      scoreRiesgo: Math.round(score),
      nivelRiesgo,
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo resumen: " + error.message });
  }
};

// Clasificar y guardar desde Postman/app
const clasificarYGuardar = async (req, res) => {
  try {
    console.log("Paciente:", req.body.pacienteId);
    console.log("Archivo:", req.file?.originalname);
    console.log("Tamaño:", req.file?.size);
    const {
      pacienteId,
      frecuencia_respiratoria,
      ruido,
      sibilancias,
      roncus,
      sintomas,
      acelerometro,
      features,
      timestamp,
    } = req.body;

    if (!pacienteId) {
      return res.status(400).json({ error: "El pacienteId es obligatorio" });
    }

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Debe enviarse un archivo de audio en el campo 'file'" });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const form = new FormData();
    form.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(`${ML_API_URL}/predict-audio`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });
    console.log("RESPUESTA ML:");
    console.log(response.data);

    const {
      prediccion,
      confianza,
      frecuencia_respiratoria: frecuenciaRespiratoriaML,
      calidad_rpm,
      audio_url,
      ruta_audio,
      clase_guardada,
      waveform_url,
      spectrogram_url,
      score_riesgo,
      nivel_riesgo,
      repetir_captura,
      estado_modelo,
      features_resumen,
    } = response.data;

    const nuevaMedicion = new Medicion({
      paciente: pacienteId,
      frecuencia_respiratoria:
        frecuenciaRespiratoriaML !== undefined &&
        frecuenciaRespiratoriaML !== null
          ? Number(frecuenciaRespiratoriaML)
          : 0,
      ruido: ruido ? Number(ruido) : undefined,
      sibilancias: sibilancias ? Number(sibilancias) : 0,
      roncus: roncus ? Number(roncus) : 0,
      sintomas: sintomas || {},
      resultado: {
        tipo: prediccion,
        confianza: confianza,
      },
      features: features_resumen || features || undefined,
      acelerometro: acelerometro || undefined,
      audio_filename: fileName,
      audio_url: audio_url || null,
      ruta_audio: ruta_audio || null,
      waveform_url: waveform_url || null,
      spectrogram_url: spectrogram_url || null,
      clase_guardada: clase_guardada || prediccion || null,
      timestamp: timestamp || new Date(),
    });

    await nuevaMedicion.save();

    res.status(201).json({
      mensaje: "Medición clasificada y guardada correctamente",
      medicion: nuevaMedicion,
    });
  } catch (error) {
    console.error("Error en clasificarYGuardar:", error.response?.data || error.message);

    res.status(500).json({
      error: "Error al clasificar y guardar la medición",
      detalle: error.response?.data || error.message,
    });
  }
};

// Clasificar y guardar audio desde ESP32
const iotAudio = async (req, res) => {
  try {
    const { pacienteId } = req.body;

    if (!pacienteId) {
      return res.status(400).json({ error: "El pacienteId es obligatorio" });
    }

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Debe enviarse el archivo WAV en el campo 'file'",
      });
    }

    const fileName = `${Date.now()}_${req.file.originalname || "audio.wav"}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, req.file.buffer);

    const form = new FormData();
    form.append("file", req.file.buffer, fileName);

    const response = await axios.post(`${ML_API_URL}/predict-audio`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    const {
      prediccion,
      confianza,
      frecuencia_respiratoria: frecuenciaRespiratoriaML,
      calidad_rpm,
      ruido,
      audio_url,
      ruta_audio,
      clase_guardada,
      waveform_url,
      spectrogram_url,
      features_resumen,
      score_riesgo,
      nivel_riesgo,
      repetir_captura,
      estado_modelo,
    } = response.data;

    console.log("RPM recibidas desde ML:", frecuenciaRespiratoriaML);
    console.log("Calidad RPM:", calidad_rpm);

    const nuevaMedicion = new Medicion({
      paciente: pacienteId,

      frecuencia_respiratoria:
        frecuenciaRespiratoriaML !== undefined &&
        frecuenciaRespiratoriaML !== null
          ? Number(frecuenciaRespiratoriaML)
          : 0,

      ruido:
        ruido !== undefined && ruido !== null
          ? Number(ruido)
          : undefined,

      resultado: {
        tipo: prediccion,
        confianza: Number(confianza || 0),
      },

      features: features_resumen || undefined,

      audio_filename: fileName,
      audio_url: audio_url || null,
      ruta_audio: ruta_audio || null,

      waveform_url: waveform_url || null,
      spectrogram_url: spectrogram_url || null,

      clase_guardada:
        clase_guardada || prediccion || null,

      score_riesgo: Number(score_riesgo || 0),
      nivel_riesgo: nivel_riesgo || "bajo",

      repetir_captura: Boolean(repetir_captura),

      estado_modelo:
        estado_modelo || "confiable",
    });

    await nuevaMedicion.save();

    res.status(201).json({
      mensaje: "Audio IoT clasificado y guardado correctamente",
      medicion: nuevaMedicion,
    });
  } catch (error) {
    console.error("Error en iotAudio:", error.response?.data || error.message);

    res.status(500).json({
      error: "Error al procesar audio IoT",
      detalle: error.response?.data || error.message,
    });
  }
};

// Eliminar medición
const eliminarMedicion = async (req, res) => {
  console.log("ID recibido:", req.params.id);
  try {
    const { id } = req.params;

    const medicion = await Medicion.findById(id);

    if (!medicion) {
      return res.status(404).json({
        error: "Medición no encontrada",
      });
    }

    await Medicion.findByIdAndDelete(id);

    res.json({
      mensaje: "Medición eliminada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: "Error eliminando medición: " + error.message,
    });
  }
};

module.exports = {
  crearMedicion,
  obtenerHistorial,
  obtenerEstadisticas,
  obtenerResumen,
  clasificarYGuardar,
  iotAudio,
  eliminarMedicion,
};
