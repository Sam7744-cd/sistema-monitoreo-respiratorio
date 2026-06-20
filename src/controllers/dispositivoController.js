const Dispositivo = require("../models/Dispositivo");

const CODIGO_PRINCIPAL =
  process.env.DISPOSITIVO_CODIGO ||
  "ESP32-RESP-001";

async function obtenerOCrearPrincipal() {
  return Dispositivo.findOneAndUpdate(
    {
      codigo: CODIGO_PRINCIPAL,
    },
    {
      $setOnInsert: {
        codigo: CODIGO_PRINCIPAL,
        nombre:
          "Prototipo respiratorio principal",
        descripcion:
          "Dispositivo portable IoT para captura y monitoreo de sonidos respiratorios.",
        tipoControlador: "ESP32 Tipo-C",
        sensores: {
          microfono: "INMP441",
          acelerometro: "MPU6050",
          pantalla: "LCD 16x2 I2C",
        },
        configuracion: {
          frecuenciaMuestreo: 16000,
          muestrasFFT: 1024,
          conectividad: "WiFi",
          versionFirmware: "1.0.0",
        },
        estado: "activo",
        ubicacion:
          "Fundación AVSI Ecuador, sede Santa Elena",
        activo: true,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).populate(
    "pacienteActual",
    "nombres apellidos nombre cedula"
  );
}

// Crea el dispositivo principal si aún no existe.
const inicializarPrincipal = async (
  req,
  res
) => {
  try {
    const dispositivo =
      await obtenerOCrearPrincipal();

    res.status(201).json({
      mensaje:
        "Dispositivo principal inicializado correctamente",
      dispositivo,
    });
  } catch (error) {
    console.error(
      "Error inicializando dispositivo:",
      error
    );

    res.status(500).json({
      error:
        "No se pudo inicializar el dispositivo",
    });
  }
};

const obtenerPrincipal = async (
  req,
  res
) => {
  try {
    const dispositivo =
      await obtenerOCrearPrincipal();

    res.json({
      dispositivo,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "No se pudo obtener el dispositivo",
    });
  }
};

const listarDispositivos = async (
  req,
  res
) => {
  try {
    const dispositivos =
      await Dispositivo.find()
        .populate(
          "pacienteActual",
          "nombres apellidos nombre cedula"
        )
        .sort({
          createdAt: -1,
        });

    res.json({
      total: dispositivos.length,
      dispositivos,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "No se pudieron obtener los dispositivos",
    });
  }
};

const actualizarPrincipal = async (
  req,
  res
) => {
  try {
    const permitidos = [
      "nombre",
      "descripcion",
      "estado",
      "ubicacion",
      "observaciones",
      "activo",
    ];

    const cambios = {};

    for (const campo of permitidos) {
      if (
        req.body[campo] !== undefined
      ) {
        cambios[campo] =
          req.body[campo];
      }
    }

    if (
      req.body.versionFirmware !==
      undefined
    ) {
      cambios[
        "configuracion.versionFirmware"
      ] = String(
        req.body.versionFirmware
      ).trim();
    }

    const dispositivo =
      await Dispositivo.findOneAndUpdate(
        {
          codigo: CODIGO_PRINCIPAL,
        },
        {
          $set: cambios,
          $setOnInsert: {
            codigo: CODIGO_PRINCIPAL,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      ).populate(
        "pacienteActual",
        "nombres apellidos nombre cedula"
      );

    res.json({
      mensaje:
        "Dispositivo actualizado correctamente",
      dispositivo,
    });
  } catch (error) {
    console.error(
      "Error actualizando dispositivo:",
      error
    );

    res.status(500).json({
      error:
        "No se pudo actualizar el dispositivo",
    });
  }
};

// Ruta opcional para que el prototipo notifique
// que está encendido y conectado.
const registrarConexion = async (
  req,
  res
) => {
  try {
    const dispositivo =
      await Dispositivo.findOneAndUpdate(
        {
          codigo: CODIGO_PRINCIPAL,
        },
        {
          $set: {
            ultimaConexion: new Date(),
            estado: "activo",
            activo: true,
          },
          $setOnInsert: {
            codigo: CODIGO_PRINCIPAL,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    res.json({
      mensaje:
        "Conexión del dispositivo registrada",
      dispositivo,
    });
  } catch (error) {
    res.status(500).json({
      error:
        "No se pudo registrar la conexión",
    });
  }
};

module.exports = {
  inicializarPrincipal,
  obtenerPrincipal,
  listarDispositivos,
  actualizarPrincipal,
  registrarConexion,
  obtenerOCrearPrincipal,
};
