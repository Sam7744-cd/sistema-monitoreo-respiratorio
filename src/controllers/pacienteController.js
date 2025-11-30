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

    let familiarUsuario = await Usuario.findOne({
      $or: [
        { email: familiar.correo },
        { cedula: familiar.cedula }
      ]
    });

    if (!familiarUsuario) {
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

    const nuevoPaciente = new Paciente({
      ...paciente,
      medico: medicoId,
      familiares: [familiarUsuario._id]
    });

    await nuevoPaciente.save();

    if (!familiarUsuario.pacientes) familiarUsuario.pacientes = [];

    if (!familiarUsuario.pacientes.includes(nuevoPaciente._id)) {
      familiarUsuario.pacientes.push(nuevoPaciente._id);
      await familiarUsuario.save();
    }

    await Usuario.findByIdAndUpdate(medicoId, {
      $addToSet: { pacientes: nuevoPaciente._id }
    });

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
// ASOCIAR FAMILIAR A PACIENTE POR CÉDULA
// -------------------------------------------------------------
const asociarPorCedula = async (req, res) => {
  try {
    const { cedulaPaciente, cedulaFamiliar } = req.body;

    if (!cedulaPaciente || !cedulaFamiliar) {
      return res.status(400).json({ error: "Faltan cédulas" });
    }

    const paciente = await Paciente.findOne({ cedula: cedulaPaciente });

    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const familiar = await Usuario.findOne({
      cedula: cedulaFamiliar,
      rol: "familiar",
    });

    if (!familiar) {
      return res.status(404).json({ error: "Familiar no encontrado" });
    }

    if (!paciente.familiares.includes(familiar._id)) {
      paciente.familiares.push(familiar._id);
      await paciente.save();
    }

    if (!familiar.pacientes.includes(paciente._id)) {
      familiar.pacientes.push(paciente._id);
      await familiar.save();
    }

    res.json({
      mensaje: "Asociación realizada con éxito",
      paciente,
      familiar,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en servidor" });
  }
};


// -------------------------------------------------------------
const obtenerPacientes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    let pacientes = [];

    // Médico → sus pacientes
    if (rol === "medico") {
      pacientes = await Paciente.find({ medico: usuarioId });
    }

    // Familiar → los pacientes asociados a él
    else if (rol === "familiar") {
      pacientes = await Paciente.find({ familiares: usuarioId });
    }

    res.json(pacientes);
  } catch (error) {
    console.error("ERROR obtenerPacientes:", error);
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
  asociarPorCedula,
  obtenerPacientes,
  obtenerPaciente,
  agregarFamiliar,
  obtenerResumenPaciente
};
