const mongoose = require("mongoose");

const MedicionTiempoRealSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      required: true
    },

    movX: Number,
    movY: Number,
    movZ: Number,
    ruido: Number,

    diagnostico: String,    // Lo calculara el backend
    alerta: Boolean         // Tambien lo calcula  el backend
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicionTiempoReal", MedicionTiempoRealSchema);
