const mongoose = require('mongoose');

// Defino el esquema del modelo Dispositivo
const dispositivoSchema = new mongoose.Schema({
  // Relaciono el dispositivo con un paciente específico
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true
  },

  // Nombre opcional para identificar el dispositivo (ej: “Pulmoncito de Pedro”)
  nombre: {
    type: String,
    trim: true
  },

  // Dirección MAC del ESP32, para identificarlo de forma única
  mac: {
    type: String,
    trim: true,
    unique: true
  },

  // Última vez que se conectó el dispositivo
  ultimaConexion: {
    type: Date,
    default: null
  },

  // Estado general del dispositivo (activo, inactivo, mantenimiento, etc.)
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'mantenimiento'],
    default: 'activo'
  },

  // Opcional: versión del firmware que ejecuta el dispositivo
  versionFirmware: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});


module.exports = mongoose.model('Dispositivo', dispositivoSchema);
