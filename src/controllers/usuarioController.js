const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

exports.asociarPaciente = async (req, res) => {
  try {
    const { pacienteId, familiarId } = req.body;

    if (
      !familiarId ||
      String(familiarId).startsWith("pendiente-") ||
      !mongoose.Types.ObjectId.isValid(familiarId)
    ) {
      return res.status(409).json({
        error:
          "Este responsable todavía no tiene una cuenta familiar registrada. Debe registrarse con la misma cédula o correo.",
        pendiente: true,
      });
    }

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
        "nombre email rol telefono cedula parentesco direccion especialidad createdAt ultimoAcceso activo authProvider googleId emailVerificado"
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
      "nombre email rol telefono cedula parentesco direccion especialidad ultimoAcceso activo createdAt authProvider googleId emailVerificado"
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
      email,
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

    if (nombre !== undefined) {
      usuario.nombre = String(nombre).trim();
    }

    if (email !== undefined) {
      const emailNormalizado = String(email)
        .trim()
        .toLowerCase();

      if (!emailNormalizado) {
        return res.status(400).json({
          error:
            "El correo electrónico es obligatorio",
        });
      }

      const correoEnUso =
        await Usuario.findOne({
          _id: {
            $ne: usuario._id,
          },
          email: emailNormalizado,
        });

      if (correoEnUso) {
        return res.status(400).json({
          error:
            "Ya existe otro usuario con ese correo",
        });
      }

      const correoCambio =
        emailNormalizado !==
        String(usuario.email || "")
          .trim()
          .toLowerCase();

      if (correoCambio) {
        usuario.email = emailNormalizado;

        /*
          El googleId pertenece al correo anterior.
          Se elimina para evitar una vinculación incorrecta.
        */
        usuario.googleId = null;
        usuario.emailVerificado = false;

        if (usuario.password) {
          usuario.authProvider = "local";
        }
      }
    }

    if (telefono !== undefined) {
      usuario.telefono = telefono;
    }

    if (cedula !== undefined) {
      usuario.cedula = cedula;
    }

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

exports.restablecerPasswordAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (usuario.activo === false) {
      return res.status(400).json({
        error:
          "No se puede restablecer la contraseña de un usuario inactivo",
      });
    }

    /*
      Se genera una contraseña temporal segura.
      Solo se devuelve una vez al administrador.
      MongoDB guarda únicamente el hash.
    */
    const mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const minusculas = "abcdefghijkmnopqrstuvwxyz";
    const numeros = "23456789";
    const simbolos = "@#$%";

    const elegir = (texto) =>
      texto[
        Math.floor(Math.random() * texto.length)
      ];

    const baseTemporal = [
      elegir(mayusculas),
      elegir(minusculas),
      elegir(numeros),
      elegir(simbolos),
    ];

    const todos =
      mayusculas +
      minusculas +
      numeros +
      simbolos;

    while (baseTemporal.length < 10) {
      baseTemporal.push(elegir(todos));
    }

    const passwordTemporal = baseTemporal
      .sort(() => Math.random() - 0.5)
      .join("");

    usuario.password = await bcrypt.hash(
      passwordTemporal,
      10
    );

    /*
      Si era una cuenta creada solo con Google,
      ahora también podrá entrar con contraseña.
      No se elimina googleId, por lo que conserva
      ambos métodos de acceso.
    */
    if (usuario.googleId) {
      usuario.authProvider = "google";
    } else {
      usuario.authProvider = "local";
    }

    await usuario.save();

    return res.json({
      mensaje:
        "Contraseña temporal generada correctamente",
      passwordTemporal,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        metodoAcceso:
          usuario.googleId
            ? "Google + contraseña"
            : "Contraseña",
      },
    });
  } catch (error) {
    console.error(
      "Error restableciendo contraseña desde admin:",
      error
    );

    return res.status(500).json({
      error:
        "No se pudo restablecer la contraseña",
    });
  }
};
