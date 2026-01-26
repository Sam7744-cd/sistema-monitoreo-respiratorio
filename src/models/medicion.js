// src/models/medicion.js
const mongoose = require('mongoose');

const MedicionSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },

  frecuencia_respiratoria: Number,
  sibilancias: Number,
  roncus: Number,

  audio: String,

  acelerometro: {
    x: Number,
    y: Number,
    z: Number
  },

  resultado: {
    tipo: {
      type: String,
      default: "por determinar"
    },
    confianza: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,


  collection: "mediciones_historicas"
});

// evita overwrite model
module.exports =
  mongoose.models.Medicion ||
  mongoose.model("Medicion", MedicionSchema);
