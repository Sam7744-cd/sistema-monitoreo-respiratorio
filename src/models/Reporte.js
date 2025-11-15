// Importo Mongoose para definir el esquema del modelo
const mongoose = require('mongoose');

// esquema de los reportes médicos
const reporteSchema = new mongoose.Schema({
  // ID del paciente al que pertenece el reporte
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },

  // ID del médico que creó el reporte
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // Contenido textual del reporte (diagnóstico, observaciones, etc.)
  contenido: {
    type: String,
    required: true,
    trim: true
  },

  // Fecha automática en la que se creó el reporte
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

// Exporto el modelo con el nombre 'Reporte' para usarlo en controladores y rutas
module.exports = mongoose.model('Reporte', reporteSchema);
