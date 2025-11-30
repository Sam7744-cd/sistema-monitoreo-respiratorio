const mongoose = require("mongoose");

const medicionTiempoRealSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true,
    },

    // -------------------------
    // MOVIMIENTO (MPU6050)
    // -------------------------
    movX: { type: Number, default: 0 },
    movY: { type: Number, default: 0 },
    movZ: { type: Number, default: 0 },

    // -------------------------
    // AUDIO / CARAC. RESPIRATORIAS
    // -------------------------
    ruido: { type: Number, default: 0 },               // dB
    rms: { type: Number, default: 0 },                 // Root Mean Square (energía)
    zcr: { type: Number, default: 0 },                 // Zero Crossing Rate
    spectral_centroid: { type: Number, default: 0 },   // Centroide espectral
    wheeze_ratio: { type: Number, default: 0 },        // Sibilancias
    roncus_ratio: { type: Number, default: 0 },        // Roncus

    // -------------------------
    // RESULTADO DEL BACKEND
    // -------------------------
    diagnostico: {
      type: String,
      enum: ["Normal", "Asma", "Bronquitis"],
      default: "Normal",
    },

    alerta: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicionTiempoReal", medicionTiempoRealSchema);
