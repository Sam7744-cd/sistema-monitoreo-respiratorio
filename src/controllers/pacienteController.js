// -------------------------------------------------------------
// pacienteController.js - Versión final estable
// -------------------------------------------------------------
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const Medicion = require('../models/medicion');
const Alerta = require('../models/Alerta');
const Reporte = require('../models/Reporte');

// -------------------------------------------------------------
// Crear paciente
// -------------------------------------------------------------
const crearPaciente = async (req, res) => {
  try {
    const medicoId = req.usuario.id;

    const paciente = new Paciente({
      ...req.body,
      medico: medicoId,
      familiares: []
    });

    await paciente.save();

    await Usuario.findByIdAndUpdate(medicoId, {
      $push: { pacientes: paciente._id }
    });

    res.status(201).json({
      mensaje: "Paciente creado exitosamente",
      paciente
    });
  } catch (error) {
    res.status(500).json({ error: "Error creando paciente: " + error.message });
  }
};

// -------------------------------------------------------------
// Obtener pacientes SOLO del médico actual
// -------------------------------------------------------------
const obtenerPacientes = async (req, res) => {
  try {
    const medicoId = req.usuario.id;

    const pacientes = await Paciente.find({ medico: medicoId });

    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
};

// -------------------------------------------------------------
const obtenerPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.findById(req.params.id)
      .populate("medico", "nombre email")
      .populate("familiares", "nombre email telefono");

    if (!paciente)
      return res.status(404).json({ error: "Paciente no encontrado" });

    res.json({ paciente });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo paciente" });
  }
};

// -------------------------------------------------------------
const agregarFamiliar = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { familiarId } = req.body;

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente)
      return res.status(404).json({ error: "Paciente no encontrado" });

    const familiar = await Usuario.findById(familiarId);
    if (!familiar || familiar.rol !== "familiar")
      return res.status(400).json({ error: 'Debe ser un usuario rol "familiar"' });

    if (!paciente.familiares.includes(familiarId)) {
      paciente.familiares.push(familiarId);
      await paciente.save();
    }

    if (!familiar.pacientes.includes(pacienteId)) {
      familiar.pacientes.push(pacienteId);
      await familiar.save();
    }

    res.json({ mensaje: "Familiar agregado", paciente });
  } catch (error) {
    res.status(500).json({ error: "Error agregando familiar" });
  }
};

// -------------------------------------------------------------
const obtenerResumenPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findById(id);
    if (!paciente)
      return res.status(404).json({ error: "Paciente no encontrado" });

    const ultimaMedicion = await Medicion.findOne({ paciente: id })
      .sort({ fechaHora: -1 });

    const alertasPendientes = await Alerta.find({ paciente: id, leido: false })
      .sort({ fecha: -1 });

    const reportesRecientes = await Reporte.find({ paciente: id })
      .sort({ fecha: -1 })
      .limit(3);

    res.json({
      paciente,
      ultimaMedicion,
      alertasPendientes,
      reportesRecientes
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo resumen" });
  }
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente
};
