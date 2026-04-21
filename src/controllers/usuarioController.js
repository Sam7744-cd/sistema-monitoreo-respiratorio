const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const bcrypt = require("bcryptjs");

exports.asociarPaciente = async (req, res) => {
  try {
    const { pacienteId, familiarId } = req.body;

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const familiar = await Usuario.findById(familiarId);
    if (!familiar || familiar.rol !== "familiar") {
      return res.status(400).json({ error: "Familiar inválido" });
    }

    if (familiar.pacientes.includes(pacienteId)) {
      return res.status(400).json({ error: "Paciente ya asociado" });
    }

    familiar.pacientes.push(pacienteId);
    await familiar.save();

    res.json({
      mensaje: "Paciente asociado correctamente",
      pacienteId,
      familiarId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al asociar paciente" });
  }
};

exports.adminResumen = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments();
    const totalMedicos = await Usuario.countDocuments({ rol: "medico" });
    const totalFamiliares = await Usuario.countDocuments({ rol: "familiar" });
    const totalAdmins = await Usuario.countDocuments({ rol: "admin" });
    const totalPacientes = await Paciente.countDocuments();

    const ultimosAccesos = await Usuario.find({
      ultimoAcceso: { $ne: null },
    })
      .select("nombre email rol ultimoAcceso")
      .sort({ ultimoAcceso: -1 })
      .limit(5);

    const usuariosRecientes = await Usuario.find({})
      .select("nombre email rol createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsuarios,
      totalMedicos,
      totalFamiliares,
      totalAdmins,
      totalPacientes,
      ultimosAccesos,
      usuariosRecientes,
    });
  } catch (error) {
    res.status(500).json({ error: "Error cargando resumen admin: " + error.message });
  }
};

exports.listarUsuariosAdmin = async (req, res) => {
  try {
    const usuarios = await Usuario.find({})
      .select(
        "nombre email rol telefono cedula parentesco direccion especialidad createdAt ultimoAcceso activo"
      )
      .sort({ createdAt: -1 });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error cargando usuarios: " + error.message });
  }
};

exports.obtenerUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id).select(
      "nombre email rol telefono cedula parentesco direccion especialidad ultimoAcceso activo createdAt"
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo usuario: " + error.message });
  }
};

exports.crearUsuarioAdmin = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      telefono,
      cedula,
      rol,
      direccion,
      especialidad,
    } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (!["medico", "admin"].includes(rol)) {
      return res.status(400).json({ error: "Rol no permitido" });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "Ya existe un usuario con ese correo" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      telefono,
      cedula,
      rol,
      direccion: rol === "medico" ? direccion || "" : "",
      especialidad: rol === "medico" ? especialidad || "" : "",
    });

    await nuevoUsuario.save();

    res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error creando usuario: " + error.message });
  }
};

exports.actualizarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      telefono,
      cedula,
      rol,
      activo,
      direccion,
      especialidad,
    } = req.body;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (nombre !== undefined) usuario.nombre = nombre;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (cedula !== undefined) usuario.cedula = cedula;

    if (rol !== undefined) {
      if (!["medico", "familiar", "admin"].includes(rol)) {
        return res.status(400).json({ error: "Rol no permitido" });
      }
      usuario.rol = rol;
    }

    if (activo !== undefined) {
      usuario.activo = activo;
    }

    if (usuario.rol === "medico") {
      usuario.direccion = direccion ?? usuario.direccion;
      usuario.especialidad = especialidad ?? usuario.especialidad;
    } else {
      usuario.direccion = "";
      usuario.especialidad = "";
    }

    await usuario.save();

    res.json({
      mensaje: "Usuario actualizado correctamente",
      usuario,
    });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando usuario: " + error.message });
  }
};

exports.eliminarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.rol === "admin") {
      return res.status(400).json({
        error: "No se puede eliminar un usuario administrador",
      });
    }

    if (usuario.rol === "familiar") {
      await Paciente.updateMany(
        { familiares: usuario._id },
        { $pull: { familiares: usuario._id } }
      );
    }

    if (usuario.rol === "medico") {
      await Paciente.updateMany(
        { medico: usuario._id },
        { $unset: { medico: "" } }
      );
    }

    await Usuario.findByIdAndDelete(id);

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando usuario: " + error.message });
  }
};