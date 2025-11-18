const mongoose = require("mongoose");

const MedicionTiempoRealSchema = new mongoose.Schema(
  {
    movX: Number,
    movY: Number,
    movZ: Number,
    ruido: Number,
    diagnostico: String,
    alerta: Boolean
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicionTiempoReal", MedicionTiempoRealSchema);
