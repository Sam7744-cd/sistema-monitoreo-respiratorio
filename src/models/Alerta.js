// Modelo de Alerta
// Este esquema representa las alertas generadas automáticamente por el sistema
// cuando se detectan valores críticos en las mediciones del paciente.

const mongoose = require('mongoose');

const AlertaSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente', // Relación con el modelo Paciente
    required: true
  },
  tipo: {
    type: String,
    enum: ['sibilancia', 'roncus', 'frecuencia_alta', 'frecuencia_baja'], // Tipos posibles
    required: true
  },
  mensaje: {
    type: String,
    required: true // Mensaje personalizado para mostrar en el dashboard o app
  },
  fecha: {
    type: Date,
    default: Date.now // Fecha automática de la alerta
  },
  leido: {
    type: Boolean,
    default: false // Para marcar si la alerta ya fue leída por el médico o familiar
  }
}, {
  timestamps: true // Agrega automáticamente campos createdAt y updatedAt
});

module.exports = mongoose.model('Alerta', AlertaSchema);
