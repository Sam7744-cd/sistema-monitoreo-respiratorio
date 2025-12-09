// models/MedicionHistorica.js
const mongoose = require("mongoose");

const MedicionHistoricaSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },

    // Movimiento
    movX: Number,
    movY: Number,
    movZ: Number,

    // Características de audio
    ruido: Number, // dB
    rms: Number,
    zcr: Number,
    spectral_centroid: Number,
    wheeze_ratio: Number,
    roncus_ratio: Number,

    // Señal FFT (si se envía)
    audio_fft: {
      type: Array,
      default: [],
    },

    // Diagnóstico calculado
    diagnostico: {
      type: String,
      enum: ["Normal", "Asma", "Bronquitis", "Indeterminado"],
      default: "Indeterminado",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicionHistorica", MedicionHistoricaSchema);
