const mongoose = require("mongoose");

const MedicionSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },

    frecuencia_respiratoria: Number,
    ruido: Number,

    sibilancias: Number,
    roncus: Number,

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
  },
  {
    timestamps: true,
    collection: "mediciones",
  }
);

module.exports =
  mongoose.models.Medicion || mongoose.model("Medicion", MedicionSchema);