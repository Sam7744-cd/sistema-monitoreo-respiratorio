const mongoose = require('mongoose');

const MedicionSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },

  frecuencia_respiratoria: Number,
  ruido: Number,

  sibilancias: Number,
  roncus: Number,

  resultado: {
    tipo: {
      type: String,
      default: "por determinar"
    },
    confianza: {
      type: Number,
      default: 0
    }
  },

  features: {
    rms: Number,
    zcr: Number,
    centroide: Number,
    espectral: Number
  },

  acelerometro: {
    x: Number,
    y: Number,
    z: Number
  }

}, {
  timestamps: true,
  collection: "mediciones"  //  TODO VA AQUÍ
});

module.exports =
  mongoose.models.Medicion ||
  mongoose.model("Medicion", MedicionSchema);