// Importamos los modelos necesarios
const Medicion = require('../models/medicion');  // Modelo de medición
const Paciente = require('../models/Paciente');  // Modelo de paciente

//  Controlador para registrar una nueva medición
const crearMedicion = async (req, res) => {
  try {
    const { pacienteId, frecuencia_respiratoria, sibilancias, roncus, timestamp } = req.body;

    // Verificamos que el paciente exista
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Creamos una nueva instancia de medición
    const nuevaMedicion = new Medicion({
      paciente: pacienteId,
      frecuencia_respiratoria,
      sibilancias,
      roncus,
      timestamp: timestamp || new Date() // Si no se especifica, se usa la fecha actual
    });

    // Guardamos la medición en la base de datos
    await nuevaMedicion.save();

    // Enviamos respuesta al cliente
    res.status(201).json({
      mensaje: 'Medición registrada exitosamente',
      medicion: nuevaMedicion
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creando medición: ' + error.message });
  }
};

// Controlador para obtener el historial de mediciones de un paciente
const obtenerHistorial = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    // Buscamos todas las mediciones asociadas al paciente ordenadas por fecha
    const mediciones = await Medicion.find({ paciente: pacienteId }).sort({ timestamp: -1 });

    res.json( mediciones );
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo historial: ' + error.message });
  }
};

//  Controlador para obtener estadísticas generales de las mediciones de un paciente
const obtenerEstadisticas = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const mediciones = await Medicion.find({ paciente: pacienteId });

    if (mediciones.length === 0) {
      return res.status(404).json({ error: 'No hay mediciones registradas para este paciente' });
    }

    const total = mediciones.length;

    // Cálculo de estadísticas básicas
    const promedioFR = mediciones.reduce((sum, m) => sum + m.frecuencia_respiratoria, 0) / total;
    const porcentajeSibilancias = (mediciones.filter(m => m.sibilancias).length / total) * 100;
    const porcentajeRoncus = (mediciones.filter(m => m.roncus).length / total) * 100;

    res.json({
      totalMediciones: total,
      promedioFrecuenciaRespiratoria: promedioFR.toFixed(2),
      porcentajeSibilancias: porcentajeSibilancias.toFixed(2),
      porcentajeRoncus: porcentajeRoncus.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas: ' + error.message });
  }
};

// Exportamos todos los controladores para usarlos en las rutas
module.exports = {
  crearMedicion,
  obtenerHistorial,
  obtenerEstadisticas
};
