const mongoose = require("mongoose");

const dispositivoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    nombre: {
      type: String,
      default: "Prototipo respiratorio principal",
      trim: true,
    },

    descripcion: {
      type: String,
      default:
        "Dispositivo portable IoT para captura y monitoreo de sonidos respiratorios.",
      trim: true,
    },

    tipoControlador: {
      type: String,
      default: "ESP32 Tipo-C",
      trim: true,
    },

    sensores: {
      microfono: {
        type: String,
        default: "INMP441",
      },
      acelerometro: {
        type: String,
        default: "MPU6050",
      },
      pantalla: {
        type: String,
        default: "LCD 16x2 I2C",
      },
    },

    configuracion: {
      frecuenciaMuestreo: {
        type: Number,
        default: 16000,
      },
      muestrasFFT: {
        type: Number,
        default: 1024,
      },
      conectividad: {
        type: String,
        default: "WiFi",
      },
      versionFirmware: {
        type: String,
        default: "1.0.0",
      },
    },

    estado: {
      type: String,
      enum: [
        "activo",
        "inactivo",
        "mantenimiento",
      ],
      default: "activo",
    },

    ultimaConexion: {
      type: Date,
      default: null,
    },

    ultimaCaptura: {
      type: Date,
      default: null,
    },

    totalCapturas: {
      type: Number,
      default: 0,
      min: 0,
    },

    pacienteActual: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente",
      default: null,
    },

    ubicacion: {
      type: String,
      default: "Fundación AVSI Ecuador, sede Santa Elena",
      trim: true,
    },

    observaciones: {
      type: String,
      default: "",
      trim: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "dispositivos",
  }
);

module.exports =
  mongoose.models.Dispositivo ||
  mongoose.model(
    "Dispositivo",
    dispositivoSchema
  );
