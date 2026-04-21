const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Registro de usuario
const registrar = async (req, res) => {
  try {
    const { nombre, email, password, telefono, cedula, parentesco } = req.body;

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      rol: "familiar",
      telefono,
      cedula,
      parentesco,
    });

    await usuario.save();

    const match = [];
    if (usuario.cedula) match.push({ "responsable.cedula": usuario.cedula });
    if (usuario.email) match.push({ "responsable.correo": usuario.email });

    if (match.length > 0) {
      const pacientes = await Paciente.find({ $or: match });

      if (pacientes.length > 0) {
        const ids = pacientes.map((p) => p._id);

        await Usuario.findByIdAndUpdate(usuario._id, {
          $addToSet: { pacientes: { $each: ids } },
        });

        await Paciente.updateMany(
          { _id: { $in: ids } },
          { $addToSet: { familiares: usuario._id } }
        );
      }
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      mensaje: "Usuario registrado exitosamente",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor: " + error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ error: "Credenciales inválidas" });

    if (usuario.activo === false) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    const contrasenaValida = await bcrypt.compare(password, usuario.password);
    if (!contrasenaValida) return res.status(400).json({ error: "Credenciales inválidas" });

    usuario.ultimoAcceso = new Date();
    await usuario.save();

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor: " + error.message });
  }
};

// OBTENER PERFIL REAL
const obtenerPerfil = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const usuario = await Usuario.findById(userId).select(
      "nombre email rol telefono cedula parentesco"
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
        cedula: usuario.cedula,
        parentesco: usuario.parentesco,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR PERFIL
const actualizarPerfil = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { telefono } = req.body;

    const usuario = await Usuario.findById(userId);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    usuario.telefono = telefono ?? usuario.telefono;

    await usuario.save();

    res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CAMBIAR CONTRASEÑA
const cambiarPassword = async (req, res) => {
  try {
    const userId = req.usuario.id;
    const { passwordActual, nuevaPassword } = req.body;

    const usuario = await Usuario.findById(userId);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide) return res.status(400).json({ error: "Contraseña actual incorrecta" });

    const hashed = await bcrypt.hash(nuevaPassword, 10);
    usuario.password = hashed;

    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
};