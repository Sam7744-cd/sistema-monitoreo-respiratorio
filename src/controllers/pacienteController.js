// -------------------------------------------------------------
// pacienteController.js - Versión final estable + registrarConFamiliar
// -------------------------------------------------------------
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const Medicion = require('../models/medicion');
const Alerta = require('../models/Alerta');
const Reporte = require('../models/Reporte');
const bcrypt = require("bcryptjs");

// -------------------------------------------------------------
// Crear paciente (versión antigua)
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
// NUEVO CONTROLADOR: Registrar PACIENTE + FAMILIAR
// -------------------------------------------------------------
const registrarConFamiliar = async (req, res) => {
  try {
    const medicoId = req.usuario.id;

    const { paciente, familiar } = req.body;

    if (!paciente || !familiar) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // ---------------------------------------------------------
    // 1. BUSCAR o CREAR FAMILIAR
    // ---------------------------------------------------------
    let familiarUsuario = await Usuario.findOne({
      $or: [
        { email: familiar.correo },
        { cedula: familiar.cedula }
      ]
    });

    if (!familiarUsuario) {
      // Crear familiar automáticamente
      familiarUsuario = new Usuario({
        nombre: familiar.nombre,
        email: familiar.correo,
        password: await bcrypt.hash(familiar.cedula + "123", 10),
        rol: "familiar",
        telefono: familiar.telefono,
        cedula: familiar.cedula,
        parentesco: familiar.parentesco,
      });

      await familiarUsuario.save();
    }

    // ---------------------------------------------------------
    // 2. CREAR PACIENTE
    // ---------------------------------------------------------
    const nuevoPaciente = new Paciente({
      ...paciente,
      medico: medicoId,
      familiares: [familiarUsuario._id]
    });

    await nuevoPaciente.save();

    // ---------------------------------------------------------
    // 3. ASOCIAR PACIENTE AL FAMILIAR
    // ---------------------------------------------------------
    if (!familiarUsuario.pacientes) familiarUsuario.pacientes = [];

    if (!familiarUsuario.pacientes.includes(nuevoPaciente._id)) {
      familiarUsuario.pacientes.push(nuevoPaciente._id);
      await familiarUsuario.save();
    }

    // ---------------------------------------------------------
    // 4. ASOCIAR PACIENTE AL MÉDICO
    // ---------------------------------------------------------
    await Usuario.findByIdAndUpdate(medicoId, {
      $addToSet: { pacientes: nuevoPaciente._id }
    });

    // ---------------------------------------------------------
    // 5. RESPUESTA
    // ---------------------------------------------------------
    res.status(201).json({
      mensaje: "Paciente y familiar registrados correctamente",
      paciente: nuevoPaciente,
      familiar: familiarUsuario
    });

  } catch (error) {
    console.error("ERROR registrarConFamiliar:", error);
    res.status(500).json({
      error: "Error en el servidor: " + error.message
    });
  }
};

// -------------------------------------------------------------
// Obtener pacientes solo del médico
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
  registrarConFamiliar,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente
};
