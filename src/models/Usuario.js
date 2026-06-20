const mongoose = require("mongoose");

// Esquema para usuarios del sistema:
// médicos, familiares y administradores.
const usuarioSchema = new mongoose.Schema(
  {
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

    /*
      La contraseña es obligatoria solamente
      para las cuentas creadas manualmente.

      Las cuentas creadas mediante Google
      no necesitan contraseña local.
    */
    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
      minlength: 6,
      default: null,
    },

    rol: {
      type: String,
      enum: ["medico", "familiar", "admin"],
      default: "familiar",
    },

    cedula: {
      type: String,
      trim: true,
      default: "",
    },

    telefono: {
      type: String,
      trim: true,
      default: "",
    },

    parentesco: {
      type: String,
      trim: true,
      default: "",
    },

    direccion: {
      type: String,
      trim: true,
      default: "",
    },

    especialidad: {
      type: String,
      trim: true,
      default: "",
    },

    /*
      Método usado para crear la cuenta.

      local:
      correo y contraseña.

      google:
      cuenta autenticada con Google.
    */
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    /*
      Identificador permanente entregado
      por Google en el campo "sub".
    */
    googleId: {
      type: String,
      trim: true,
      default: null,
    },

    /*
      Indica si el correo fue verificado.
      En cuentas Google será true.
    */
    emailVerificado: {
      type: Boolean,
      default: false,
    },

    /*
      Una cuenta Google puede crearse
      inicialmente solo con nombre y correo.

      Después se solicitarán:
      cédula, teléfono y parentesco.
    */
    perfilCompleto: {
      type: Boolean,
      default: function () {
        return this.authProvider !== "google";
      },
    },

    /*
      Campos usados para recuperar
      la contraseña de cuentas locales.
    */
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    ultimoAcceso: {
      type: Date,
      default: null,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    pacientes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Paciente",
      },
    ],
  },
  {
    timestamps: true,
  }
);

/*
  Evita duplicar el identificador de Google.
  El índice sparse permite varios usuarios
  locales con googleId null.
*/
usuarioSchema.index(
  {
    googleId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

module.exports =
  mongoose.models.Usuario ||
  mongoose.model("Usuario", usuarioSchema);
