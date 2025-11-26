const mongoose = require('mongoose');

// Esquema para usuarios del sistema (médicos, familiares, admins)
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  rol: {
    type: String,
    enum: ["medico", "familiar", "admin"],
    default: "familiar",
  },

  cedula: {
    type: String,
    trim: true,
    unique: false,
  },

  telefono: {
    type: String,
    trim: true,
  },

  parentesco: {
    type: String,
    trim: true,
  },

  pacientes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
    },
  ],
});

module.exports = mongoose.model("Usuario", usuarioSchema);
