// Controlador para manejar dispositivos IoT vinculados a pacientes

const Dispositivo = require('../models/Dispositivo');
const Paciente = require('../models/Paciente');

// Crear o registrar un nuevo dispositivo (uno por paciente)
const registrarDispositivo = async (req, res) => {
  try {
    const { pacienteId, tipo, estado } = req.body;

    // Verificar que el paciente existe
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Crear dispositivo y asociar al paciente
    const dispositivo = new Dispositivo({
      paciente: pacienteId,
      tipo,
      estado
    });

    await dispositivo.save();

    res.status(201).json({
      mensaje: 'Dispositivo registrado exitosamente',
      dispositivo
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar dispositivo: ' + error.message });
  }
};

// Obtener dispositivo de un paciente
const obtenerDispositivo = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    const dispositivo = await Dispositivo.findOne({ paciente: pacienteId });
    if (!dispositivo) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    res.json({ dispositivo });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dispositivo: ' + error.message });
  }
};

module.exports = {
  registrarDispositivo,
  obtenerDispositivo
};
