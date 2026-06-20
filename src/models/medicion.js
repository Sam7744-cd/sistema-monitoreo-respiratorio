const mongoose = require("mongoose");

const MedicionSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },

    dispositivo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dispositivo",
      default: null,
      index: true,
    },

    dispositivo_codigo: {
      type: String,
      default: "ESP32-RESP-001",
      trim: true,
    },

    frecuencia_respiratoria: Number,
    ruido: Number,

    sibilancias: Number,
    roncus: Number,

    sintomas: {
      fiebre: {
        type: Boolean,
        default: false,
      },

      tos: {
        type: Boolean,
        default: false,
      },

      retraccion_intercostal: {
        type: Boolean,
        default: false,
      },

      dificultad_respiratoria: {
        type: Boolean,
        default: false,
      },

      saturacion_baja: {
        type: Boolean,
        default: false,
      },

      observaciones_clinicas: {
        type: String,
        default: "",
      },
    },

    resultado: {
      tipo: {
        type: String,
        default: "por determinar",
      },
      confianza: {
        type: Number,
        default: 0,
      },
    },

    features: {
      duration: Number,
      rms_mean: Number,
      zcr_mean: Number,
      centroid_mean: Number,
      bandwidth_mean: Number,
    },

    acelerometro: {
      x: Number,
      y: Number,
      z: Number,
    },

    audio_filename: {
      type: String,
      default: null,
    },

    audio_url: {
      type: String,
      default: null,
    },

    ruta_audio: {
      type: String,
      default: null,
    },

    clase_guardada: {
      type: String,
      default: null,
    },

    archivo_guardado_ml: {
      type: String,
      default: null,
    },

    waveform_url: {
      type: String,
      default: null,
    },

    spectrogram_url: {
      type: String,
      default: null,
    },

    score_riesgo: {
    type: Number,
    default: 0,
  },

    nivel_riesgo: {
      type: String,
      default: "bajo",
    },

    estado_modelo: {
      type: String,
      default: "confiable",
    },

    repetir_captura: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "mediciones",
  },
  
);

module.exports =
  mongoose.models.Medicion || mongoose.model("Medicion", MedicionSchema);