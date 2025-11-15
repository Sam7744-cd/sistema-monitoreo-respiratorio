const mongoose = require('mongoose');

// Esquema para almacenar los datos de los pacientes registrados
const pacienteSchema = new mongoose.Schema({
  // Información personal básica
  nombre: { type: String, trim: true },
  cedula: { type: String, trim: true }, // Opcional: puede usarse para identificar
  edad: { type: Number },
  sexo: { type: String, enum: ['Masculino', 'Femenino'], default: undefined },
  direccion: { type: String, trim: true },
  telefono: { type: String, trim: true },
  correo: { type: String, trim: true, lowercase: true },

  // Información médica
  peso: { type: Number },
  altura: { type: Number },

  // Relación con el médico principal (usuario tipo 'medico')
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },

  // Familiares que también pueden consultar los datos del paciente
  familiares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }]
}, {
  timestamps: true // Crea createdAt y updatedAt
});

// Exportamos el modelo, previniendo errores si ya está cargado
module.exports = mongoose.models.Paciente || mongoose.model('Paciente', pacienteSchema);
