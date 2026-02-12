const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Registro de usuario
const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, especialidad } = req.body;

    console.log('Intentando registrar usuario:', email); // Para debug

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        error: 'El usuario ya existe'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const usuario = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      rol,
      telefono,
      especialidad
    });

    await usuario.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error); // Para debug
    res.status(500).json({
      error: 'Error en el servidor: ' + error.message
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(password, usuario.password);
    if (!contrasenaValida) {
      return res.status(400).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el servidor: ' + error.message
    });
  }
};


// =============================
// ACTUALIZAR PERFIL
// =============================
const actualizarPerfil = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const { nombre, telefono } = req.body;

    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.nombre = nombre ?? usuario.nombre;
    usuario.telefono = telefono ?? usuario.telefono;

    await usuario.save();

    res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono
      }
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
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

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
  actualizarPerfil,
  cambiarPassword
};
