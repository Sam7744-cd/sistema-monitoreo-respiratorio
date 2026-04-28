const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const Paciente = require("../models/Paciente");
const Medicion = require("../models/medicion");

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5001";

let pacienteActivoId = null;

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const setPacienteActivo = async (req, res) => {
  try {
    const { pacienteId } = req.body;

    if (!pacienteId) {
      return res.status(400).json({ error: "El pacienteId es obligatorio" });
    }

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    pacienteActivoId = pacienteId;

    res.json({
      mensaje: "Paciente activo configurado correctamente",
      pacienteActivoId,
      paciente,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error configurando paciente activo",
      detalle: error.message,
    });
  }
};

const getPacienteActivo = async (req, res) => {
  try {
    if (!pacienteActivoId) {
      return res.status(404).json({ error: "No hay paciente activo seleccionado" });
    }

    const paciente = await Paciente.findById(pacienteActivoId);
    if (!paciente) {
      pacienteActivoId = null;
      return res.status(404).json({ error: "El paciente activo ya no existe" });
    }

    res.json({
      pacienteActivoId,
      paciente,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error consultando paciente activo",
      detalle: error.message,
    });
  }
};

const iotAudio = async (req, res) => {
  try {
    console.log("BODY DESDE ESP32:", req.body);
    console.log("ML_API_URL usada:", ML_API_URL);

    if (!pacienteActivoId) {
      return res.status(400).json({
        error: "No hay paciente activo. Selecciónalo primero desde la app.",
      });
    }

    const paciente = await Paciente.findById(pacienteActivoId);
    if (!paciente) {
      pacienteActivoId = null;
      return res.status(404).json({ error: "Paciente activo no encontrado" });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Debe enviarse el archivo WAV en el campo 'file'",
      });
    }

    const fileName = `${Date.now()}_${req.file.originalname || "audio.wav"}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, req.file.buffer);

    const frecuenciaRespiratoria = req.body.frecuencia_respiratoria
      ? Number(req.body.frecuencia_respiratoria)
      : 0;

    const ruido = req.body.ruido ? Number(req.body.ruido) : 0;

    const acelerometro = {
      x: req.body.ax ? Number(req.body.ax) : 0,
      y: req.body.ay ? Number(req.body.ay) : 0,
      z: req.body.az ? Number(req.body.az) : 0,
    };

    const form = new FormData();
    form.append("file", req.file.buffer, fileName);

    console.log("Enviando audio al ML...");

    const response = await axios.post(`${ML_API_URL}/predict-audio`, form, {
      headers: {
        ...form.getHeaders(),
        "ngrok-skip-browser-warning": "true",
      },
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    console.log("Respuesta del ML recibida:", response.data);

    const {
      prediccion,
      confianza,
      audio_url,
      ruta_audio,
      clase_guardada,
      archivo_guardado,
      waveform_url,
      spectrogram_url,
      features_resumen,
    } = response.data;

    const nuevaMedicion = new Medicion({
      paciente: pacienteActivoId,
      frecuencia_respiratoria: frecuenciaRespiratoria,
      ruido,
      resultado: {
        tipo: prediccion,
        confianza,
      },
      acelerometro,
      audio_filename: fileName,
      audio_url: audio_url || null,
      ruta_audio: ruta_audio || null,
      clase_guardada: clase_guardada || prediccion || null,
      archivo_guardado_ml: archivo_guardado || null,
      waveform_url: waveform_url || null,
      spectrogram_url: spectrogram_url || null,
      features: features_resumen || {},
    });

    await nuevaMedicion.save();

    res.status(201).json({
      mensaje: "Audio IoT clasificado y guardado correctamente",
      pacienteActivoId,
      medicion: nuevaMedicion,
    });
  } catch (error) {
    console.error("Error en iotAudio:");
    console.error("Mensaje:", error.message);
    console.error("Respuesta ML:", error.response?.data);
    console.error("Status ML:", error.response?.status);

    res.status(500).json({
      error: "Error al procesar audio IoT",
      detalle: error.response?.data || error.message,
    });
  }
};

const proxyArchivoML = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Falta la URL del archivo" });
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      timeout: 120000,
    });

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream"
    );

    res.send(response.data);
  } catch (error) {
    console.error("Error proxyArchivoML:", error.message);

    res.status(500).json({
      error: "No se pudo cargar el archivo del ML",
      detalle: error.message,
    });
  }
};

module.exports = {
  setPacienteActivo,
  getPacienteActivo,
  iotAudio,
  proxyArchivoML,
};