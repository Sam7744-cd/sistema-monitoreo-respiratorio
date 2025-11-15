const mongoose = require('mongoose');

// Esquema para los usuarios del sistema: médicos, familiares o administradores
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'], // Validación obligatoria
    trim: true // Elimina espacios innecesarios
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true, // No se pueden repetir correos
    lowercase: true, // Convierte todo a minúsculas
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: 6 // Longitud mínima
  },
  rol: {
    type: String,
    enum: ['medico', 'familiar', 'admin'], // Tipos de usuario permitidos
    required: true,
    default: 'familiar'
  },
  telefono: {
    type: String,
    trim: true
  },
  especialidad: {
    type: String,
    trim: true
  },
  pacientes: [{
    // Un médico o familiar puede tener múltiples pacientes asociados
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente'
  }]
}, {
  timestamps: true // Añade automáticamente createdAt y updatedAt
});

// Exportamos el modelo
module.exports = mongoose.model('Usuario', usuarioSchema);
