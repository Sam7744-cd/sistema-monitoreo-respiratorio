// Importo los modelos necesarios
const Reporte = require('../models/Reporte');
const Paciente = require('../models/Paciente');

// Función para crear un nuevo reporte médico
const crearReporte = async (req, res) => {
  try {
    const { pacienteId, contenido } = req.body;

    // Verifico que el paciente exista antes de guardar el reporte
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Creo un nuevo documento de reporte con la info del médico actual
    const nuevoReporte = new Reporte({
      paciente: pacienteId,
      creadoPor: req.usuario._id, // quien crea el reporte (médico)
      contenido,
      fecha: new Date()
    });

    await nuevoReporte.save(); // Guardo en la base de datos

    res.status(201).json({
      mensaje: 'Reporte creado exitosamente',
      reporte: nuevoReporte
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear reporte: ' + error.message });
  }
};

// Función para obtener todos los reportes de un paciente
const obtenerReportesPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const reportes = await Reporte.find({ paciente: pacienteId })
      .populate('creadoPor', 'nombre email') // Muestra quién lo hizo
      .sort({ fecha: -1 }); // Ordena del más reciente al más antiguo

    res.json({ reportes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reportes: ' + error.message });
  }
};

module.exports = {
  crearReporte,
  obtenerReportesPorPaciente
};
