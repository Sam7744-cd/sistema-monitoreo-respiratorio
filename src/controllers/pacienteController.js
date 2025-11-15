const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');

// Crear nuevo paciente
const crearPaciente = async (req, res) => {
  try {
    const { nombre, edad, peso, altura } = req.body;
    
    // El médico que crea el paciente es el usuario autenticado
    const medicoId = req.usuario.id;

    const paciente = new Paciente({
      nombre,
      edad,
      peso,
      altura,
      medico: medicoId,
      familiares: [] // Se pueden agregar después
    });

    await paciente.save();

    // Agregar paciente a la lista del médico
    await Usuario.findByIdAndUpdate(
      medicoId,
      { $push: { pacientes: paciente._id } }
    );

    res.status(201).json({
      mensaje: 'Paciente creado exitosamente',
      paciente
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error creando paciente: ' + error.message
    });
  }
};

// Obtener pacientes del médico
const obtenerPacientes = async (req, res) => {
  try {
    const medicoId = req.usuario.id;
    
    const pacientes = await Paciente.find({ medico: medicoId })
      .populate('familiares', 'nombre email telefono');

    res.json({
      pacientes
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo pacientes: ' + error.message
    });
  }
};

// Obtener un paciente específico
const obtenerPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.findById(req.params.id)
      .populate('medico', 'nombre email especialidad')
      .populate('familiares', 'nombre email telefono');

    if (!paciente) {
      return res.status(404).json({
        error: 'Paciente no encontrado'
      });
    }

    // Verificar que el usuario tenga acceso al paciente
    if (paciente.medico._id.toString() !== req.usuario.id && 
        !paciente.familiares.some(f => f._id.toString() === req.usuario.id)) {
      return res.status(403).json({
        error: 'No tienes acceso a este paciente'
      });
    }

    res.json({
      paciente
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error obteniendo paciente: ' + error.message
    });
  }
};

// Agregar familiar a paciente
const agregarFamiliar = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { familiarId } = req.body;

    // Verificar que el paciente existe y pertenece al médico
    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        error: 'Paciente no encontrado'
      });
    }

    // Solo el médico asignado puede agregar familiares
    if (paciente.medico.toString() !== req.usuario.id) {
      return res.status(403).json({
        error: 'Solo el médico asignado puede agregar familiares'
      });
    }

    // Verificar que el familiar existe y es rol 'familiar'
    const familiar = await Usuario.findById(familiarId);
    if (!familiar || familiar.rol !== 'familiar') {
      return res.status(400).json({
        error: 'El usuario debe existir y tener rol "familiar"'
      });
    }

    // Agregar familiar si no existe
    if (!paciente.familiares.includes(familiarId)) {
      paciente.familiares.push(familiarId);
      await paciente.save();
    }

    // Agregar paciente a la lista del familiar
    if (!familiar.pacientes.includes(pacienteId)) {
      familiar.pacientes.push(pacienteId);
      await familiar.save();
    }

    res.json({
      mensaje: 'Familiar agregado exitosamente',
      paciente: await Paciente.findById(pacienteId).populate('familiares', 'nombre email telefono')
    });

  } catch (error) {
    res.status(500).json({
      error: 'Error agregando familiar: ' + error.message
    });
  }
};

// Obtener resumen completo de un paciente
const obtenerResumenPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el paciente existe
    const paciente = await Paciente.findById(id).select('-__v -createdAt -updatedAt');
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Última medición (ordenada por fecha descendente)
    const ultimaMedicion = await Medicion.findOne({ paciente: id })
      .sort({ fechaHora: -1 })
      .select('-__v -paciente');

    // Alertas no leídas del paciente
    const alertasPendientes = await Alerta.find({ paciente: id, leido: false })
      .sort({ fecha: -1 })
      .select('-__v -paciente');

    // Reportes más recientes
    const reportesRecientes = await Reporte.find({ paciente: id })
      .sort({ fecha: -1 })
      .limit(3)
      .select('-__v -paciente');

    res.json({
      paciente,
      ultimaMedicion,
      alertasPendientes,
      reportesRecientes
    });

  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: 'Error obteniendo resumen del paciente' });
  }
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente
};