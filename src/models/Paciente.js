const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    cedula: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{10}$/ // exactamente 10 dígitos
    },

    edad: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },

    sexo: {
      type: String,
      required: true,
      enum: ['Masculino', 'Femenino']
    },

    direccion: {
      type: String,
      required: true,
      trim: true
    },

    telefono: {
      type: String,
      required: true,
      match: /^\d{10}$/ // exactamente 10 dígitos
    },

    correo: {
      type: String,
      trim: true,
      lowercase: true
    },

    peso: Number,
    altura: Number,

    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },

    familiares: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
    ]
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Paciente ||
  mongoose.model('Paciente', pacienteSchema);
