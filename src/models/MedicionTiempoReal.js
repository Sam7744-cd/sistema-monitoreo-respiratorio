const mongoose = require("mongoose");

const MedicionTiempoRealSchema = new mongoose.Schema(
  {
    movX: Number,
    movY: Number,
    movZ: Number,
    ruido: Number,
    diagnostico: String, // "Normal", "Asma", etc.
    alerta: Boolean
  },
  { timestamps: true } // createdAt servirá para el tiempo real
);

module.exports = mongoose.model("MedicionTiempoReal", MedicionTiempoRealSchema);
