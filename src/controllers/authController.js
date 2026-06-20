const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// Registro de usuario familiar
const registrar = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      telefono,
      cedula,
      parentesco,
    } = req.body;

    const emailNormalizado = String(email || "")
      .trim()
      .toLowerCase();

    const cedulaNormalizada = String(cedula || "")
      .trim();

    if (
      !nombre ||
      !emailNormalizado ||
      !password ||
      !cedulaNormalizada
    ) {
      return res.status(400).json({
        error:
          "Nombre, correo, contraseña y cédula son obligatorios",
      });
    }

    const usuarioExistente = await Usuario.findOne({
      $or: [
        { email: emailNormalizado },
        {
          cedula: cedulaNormalizada,
          rol: "familiar",
        },
      ],
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error:
          "Ya existe una cuenta familiar con ese correo o cédula",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const usuario = new Usuario({
      nombre,
      email: emailNormalizado,
      password: hashedPassword,
      rol: "familiar",
      telefono,
      cedula: cedulaNormalizada,
      parentesco,
    });

    await usuario.save();

    const coincidencias = [
      {
        "responsable.cedula":
          cedulaNormalizada,
      },
      {
        "responsable.correo":
          emailNormalizado,
      },
    ];

    const pacientesCoincidentes =
      await Paciente.find({
        $or: coincidencias,
      }).select("_id");

    const idsPacientes =
      pacientesCoincidentes.map(
        (paciente) => paciente._id
      );

    if (idsPacientes.length > 0) {
      await Usuario.findByIdAndUpdate(
        usuario._id,
        {
          $addToSet: {
            pacientes: {
              $each: idsPacientes,
            },
          },
        }
      );

      await Paciente.updateMany(
        {
          _id: {
            $in: idsPacientes,
          },
        },
        {
          $addToSet: {
            familiares: usuario._id,
          },
        }
      );
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      mensaje:
        idsPacientes.length > 0
          ? "Cuenta creada y pacientes asociados correctamente"
          : "Cuenta creada. No se encontraron pacientes asociados.",
      token,
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
    console.error(
      "Error registrando familiar:",
      error
    );

    if (error?.code === 11000) {
      return res.status(400).json({
        error:
          "El correo ingresado ya está siendo utilizado",
      });
    }

    res.status(500).json({
      error:
        "Error en el servidor: " +
        error.message,
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const emailNormalizado = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || ""
    );

    if (!emailNormalizado || !password) {
      return res.status(400).json({
        error:
          "El correo y la contraseña son obligatorios",
      });
    }

    const usuario = await Usuario.findOne({
      email: emailNormalizado,
    });

    if (!usuario) {
      return res.status(400).json({
        error: "Credenciales inválidas",
      });
    }

    if (usuario.activo === false) {
      return res.status(403).json({
        error: "Usuario inactivo",
      });
    }

    const contrasenaValida =
      await bcrypt.compare(
        password,
        usuario.password
      );

    if (!contrasenaValida) {
      return res.status(400).json({
        error: "Credenciales inválidas",
      });
    }

    usuario.ultimoAcceso = new Date();
    await usuario.save();

    /*
      Al iniciar sesión, el sistema verifica si
      la cédula o el correo del familiar coincide
      con el responsable de algún paciente.
    */
    if (usuario.rol === "familiar") {
      const coincidencias = [];

      if (usuario.cedula) {
        coincidencias.push({
          "responsable.cedula": String(
            usuario.cedula
          ).trim(),
        });
      }

      if (usuario.email) {
        coincidencias.push({
          "responsable.correo": String(
            usuario.email
          )
            .trim()
            .toLowerCase(),
        });
      }

      if (coincidencias.length > 0) {
        const pacientesCoincidentes =
          await Paciente.find({
            $or: coincidencias,
          }).select("_id");

        const idsPacientes =
          pacientesCoincidentes.map(
            (paciente) => paciente._id
          );

        if (idsPacientes.length > 0) {
          await Usuario.findByIdAndUpdate(
            usuario._id,
            {
              $addToSet: {
                pacientes: {
                  $each: idsPacientes,
                },
              },
            }
          );

          await Paciente.updateMany(
            {
              _id: {
                $in: idsPacientes,
              },
            },
            {
              $addToSet: {
                familiares: usuario._id,
              },
            }
          );
        }
      }
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
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
        cedula: usuario.cedula,
        parentesco: usuario.parentesco,
      },
    });
  } catch (error) {
    console.error(
      "Error iniciando sesión:",
      error
    );

    res.status(500).json({
      error:
        "Error en el servidor: " +
        error.message,
    });
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