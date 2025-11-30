const MedicionTiempoReal = require("../models/medicionTiempoReal");
const { getPacienteActual } = require("./tiempoRealSeleccionController");
const { analizarRespiracion } = require("../analysisR/detectorRespiratorio");

/* ----------------------------------------------------------------
    RECIBIR MEDICIÓN DEL ESP32
   Aquí el backend procesa los datos crudos enviados por el ESP32:
   - Movimiento (MPU6050)
   - Características de audio
   - Señal FFT (opcional si envías el array)
   Después usa el analizador (detectorRespiratorio.js) para generar
   el diagnóstico real del backend.
   ------------------------------------------------------------- */
exports.recibirMedicion = async (req, res) => {
  try {
    // 1) Verificar que la app seleccionó un paciente antes de medir
    const pacienteId = getPacienteActual();

    if (!pacienteId) {
      return res.status(400).json({
        msg: "No se ha seleccionado un paciente desde la app",
      });
    }

    // Datos crudos enviados por el ESP32
    const data = req.body;


       //Sanitizar valores para evitar "undefined"
       //Esto evita que Mongo o el análisis fallen por faltantes.

    const safe = {
      movX: data.movX ?? 0,
      movY: data.movY ?? 0,
      movZ: data.movZ ?? 0,

      ruido: data.ruido ?? 0,
      rms: data.rms ?? 0,
      zcr: data.zcr ?? 0,
      spectral_centroid: data.spectral_centroid ?? 0,
      wheeze_ratio: data.wheeze_ratio ?? 0,
      roncus_ratio: data.roncus_ratio ?? 0,

      // FFT (si la envías desde el ESP32)
      audio_fft: data.audio_fft ?? [],
    };


       //2) Análisis respiratorio en el backend
       //Esta función decide: Normal / Asma / Bronquitis
       //usando reglas determinísticas + FFT (si existe).

    const diagnostico = analizarRespiracion(safe);


       // 3) Guardar en MongoDB
       //Aquí se almacena TODO lo medido y el diagnóstico final.

    const medicion = await MedicionTiempoReal.create({
      paciente: pacienteId,

      movX: safe.movX,
      movY: safe.movY,
      movZ: safe.movZ,

      ruido: safe.ruido,
      rms: safe.rms,
      zcr: safe.zcr,
      spectral_centroid: safe.spectral_centroid,
      wheeze_ratio: safe.wheeze_ratio,
      roncus_ratio: safe.roncus_ratio,

      audio_fft: safe.audio_fft, // si se envía FFT

      diagnostico,
      alerta: diagnostico !== "Normal",
    });

    return res.json(medicion);

  } catch (error) {
    console.log("ERROR RECIBIR MEDICION:", error);
    return res.status(500).json({ msg: "Error al guardar medición" });
  }
};



   //OBTENER ÚLTIMA MEDICIÓN (app móvil)
   //La app consulta cada 2–3 segundos para ver los cambios.

exports.obtenerActual = async (req, res) => {
  try {
    const ultima = await MedicionTiempoReal.findOne()
      .sort({ createdAt: -1 })
      .populate("paciente");

    if (!ultima) {
      return res.json({ msg: "No hay datos aún" });
    }

    return res.json({
      paciente: ultima.paciente._id,

      movX: ultima.movX,
      movY: ultima.movY,
      movZ: ultima.movZ,

      ruido: ultima.ruido,
      rms: ultima.rms,
      zcr: ultima.zcr,
      spectral_centroid: ultima.spectral_centroid,
      wheeze_ratio: ultima.wheeze_ratio,
      roncus_ratio: ultima.roncus_ratio,

      audio_fft: ultima.audio_fft ?? [],

      diagnostico: ultima.diagnostico,
      alerta: ultima.alerta,

      timestamp: ultima.createdAt,
    });

  } catch (error) {
    console.log("ERROR obtenerActual:", error);
    return res.status(500).json({ msg: "Error al obtener datos" });
  }
};
