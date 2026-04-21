const mongoose = require("mongoose");

const responsableSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    cedula: { type: String, required: true, trim: true, match: /^\d{10}$/ },
    telefono: { type: String, required: true, match: /^\d{10}$/ },
    correo: { type: String, trim: true, lowercase: true },
    parentesco: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const pacienteSchema = new mongoose.Schema(
  {
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },

    cedula: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{10}$/,
    },

    fechaNacimiento: { type: Date, required: true },

    sexo: { type: String, required: true, enum: ["Masculino", "Femenino"] },

    direccion: { type: String, required: true, trim: true },

    // opcionales (si quieres dejarlos)
    correo: { type: String, trim: true, lowercase: true },
    telefono: { type: String, trim: true, match: /^\d{10}$/ },

    alergias: { type: String, default: "Ninguna", trim: true },
    observaciones: { type: String, trim: true },

    medico: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

    responsable: { type: responsableSchema, required: true },

    familiares: [{ type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Paciente || mongoose.model("Paciente", pacienteSchema);