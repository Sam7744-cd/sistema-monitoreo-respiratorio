// src/models/medicion.js

const mongoose = require('mongoose');

// Defino el esquema para guardar cada medición registrada
const MedicionSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },

  // Fecha y hora de la medición
  fechaHora: {
    type: Date,
    default: Date.now
  },

  // Frecuencia respiratoria: respiraciones por minuto
  frecuencia_respiratoria: Number,

  // Porcentaje o cantidad de sibilancias detectadas
  sibilancias: Number,

  // Porcentaje o cantidad de roncus detectados
  roncus: Number,

  // Nombre del archivo de audio o base64 si se usa
  audio: String,

  // Datos del acelerómetro (por si se mide movimiento respiratorio)
  acelerometro: {
    x: Number,
    y: Number,
    z: Number
  },

  // Resultado del análisis con el diagnóstico
  resultado: {
    tipo: String, // "asma", "bronquitis", "normal", etc.
    confianza: Number // Valor entre 0 a 100 indicando precisión
  }
});

module.exports = mongoose.model('Medicion', MedicionSchema);
