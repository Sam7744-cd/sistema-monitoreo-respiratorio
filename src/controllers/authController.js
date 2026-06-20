const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario._id,
      rol: usuario.rol,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

async function asociarPacientes(usuario) {
  if (!usuario || usuario.rol !== "familiar") {
    return [];
  }

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

  if (coincidencias.length === 0) {
    return [];
  }

  const pacientes = await Paciente.find({
    $or: coincidencias,
  }).select("_id");

  const idsPacientes = pacientes.map(
    (paciente) => paciente._id
  );

  if (idsPacientes.length === 0) {
    return [];
  }

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

  return idsPacientes;
}

function datosUsuario(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    telefono: usuario.telefono,
    cedula: usuario.cedula,
    parentesco: usuario.parentesco,
    authProvider: usuario.authProvider,
    perfilCompleto: usuario.perfilCompleto,
    emailVerificado: usuario.emailVerificado,
  };
}

// REGISTRO MANUAL DE FAMILIAR
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

    const emailNormalizado = String(
      email || ""
    )
      .trim()
      .toLowerCase();

    const cedulaNormalizada = String(
      cedula || ""
    ).trim();

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

    const usuarioExistente =
      await Usuario.findOne({
        $or: [
          {
            email: emailNormalizado,
          },
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

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const usuario = new Usuario({
      nombre,
      email: emailNormalizado,
      password: hashedPassword,
      rol: "familiar",
      telefono,
      cedula: cedulaNormalizada,
      parentesco,
      authProvider: "local",
      emailVerificado: false,
      perfilCompleto: true,
    });

    await usuario.save();

    const idsPacientes =
      await asociarPacientes(usuario);

    const token = generarToken(usuario);

    res.status(201).json({
      mensaje:
        idsPacientes.length > 0
          ? "Cuenta creada y pacientes asociados correctamente"
          : "Cuenta creada. No se encontraron pacientes asociados.",
      token,
      usuario: datosUsuario(usuario),
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

// LOGIN LOCAL
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

    if (!usuario.password) {
      return res.status(400).json({
        error:
          "Esta cuenta utiliza inicio de sesión con Google",
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

    await asociarPacientes(usuario);

    const token = generarToken(usuario);

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: datosUsuario(usuario),
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

// LOGIN CON GOOGLE
// - Si el correo ya existe, conserva el rol creado previamente
//   por el administrador: médico, administrador o familiar.
// - Si el correo no existe, crea únicamente una cuenta familiar.
const loginGoogle = async (req, res) => {
  try {
    const credential = String(
      req.body.credential || ""
    ).trim();

    if (!credential) {
      return res.status(400).json({
        error:
          "No se recibió la credencial de Google",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        error:
          "GOOGLE_CLIENT_ID no está configurado en el servidor",
      });
    }

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email
    ) {
      return res.status(401).json({
        error:
          "No se pudo validar la cuenta de Google",
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        error:
          "Google no pudo verificar este correo electrónico",
      });
    }

    const googleId = String(
      payload.sub
    ).trim();

    const email = String(
      payload.email
    )
      .trim()
      .toLowerCase();

    const nombre =
      String(payload.name || "").trim() ||
      email.split("@")[0];

    /*
      Primero se busca por googleId y luego por correo.

      Si el administrador ya creó una cuenta de médico
      o administrador con ese Gmail, se vincula Google
      con esa misma cuenta y se conserva su rol.
    */
    let usuario = await Usuario.findOne({
      googleId,
    });

    if (!usuario) {
      usuario = await Usuario.findOne({
        email,
      });
    }

    let cuentaNueva = false;

    if (usuario) {
      if (usuario.activo === false) {
        return res.status(403).json({
          error: "Usuario inactivo",
        });
      }

      if (
        usuario.googleId &&
        usuario.googleId !== googleId
      ) {
        return res.status(409).json({
          error:
            "Este correo ya está vinculado con otra cuenta de Google",
        });
      }

      /*
        No se cambia usuario.rol.

        Por eso:
        - un médico creado por el administrador sigue siendo médico;
        - un administrador sigue siendo administrador;
        - un familiar existente sigue siendo familiar.
      */
      usuario.googleId = googleId;
      usuario.emailVerificado = true;

      if (!usuario.nombre) {
        usuario.nombre = nombre;
      }

      usuario.ultimoAcceso =
        new Date();

      await usuario.save();
    } else {
      /*
        Google nunca crea médicos ni administradores
        automáticamente. Una cuenta desconocida se
        registra solamente como familiar.
      */
      cuentaNueva = true;

      usuario = new Usuario({
        nombre,
        email,
        password: null,
        rol: "familiar",
        authProvider: "google",
        googleId,
        emailVerificado: true,
        perfilCompleto: false,
        ultimoAcceso: new Date(),
      });

      await usuario.save();
    }

    /*
      Solo los familiares nuevos o incompletos
      deben llenar cédula, teléfono y parentesco.
    */
    const requiereCompletarPerfil =
      usuario.rol === "familiar" &&
      !usuario.perfilCompleto;

    if (
      usuario.rol === "familiar" &&
      usuario.perfilCompleto
    ) {
      await asociarPacientes(usuario);
    }

    const token =
      generarToken(usuario);

    let mensaje =
      "Inicio de sesión con Google exitoso";

    if (requiereCompletarPerfil) {
      mensaje =
        "Completa tus datos para finalizar el registro familiar";
    } else if (
      cuentaNueva &&
      usuario.rol === "familiar"
    ) {
      mensaje =
        "Cuenta familiar creada con Google";
    } else if (
      usuario.rol === "medico"
    ) {
      mensaje =
        "Inicio de sesión médico con Google exitoso";
    } else if (
      usuario.rol === "admin"
    ) {
      mensaje =
        "Inicio de sesión administrativo con Google exitoso";
    }

    return res.json({
      mensaje,
      token,
      cuentaNueva,
      requiereCompletarPerfil,
      usuario: datosUsuario(usuario),
    });
  } catch (error) {
    console.error(
      "Error iniciando sesión con Google:",
      error
    );

    return res.status(401).json({
      error:
        "No se pudo validar el inicio de sesión con Google",
    });
  }
};

// COMPLETAR PERFIL DE GOOGLE
const completarPerfilGoogle = async (
  req,
  res
) => {
  try {
    const userId = req.usuario.id;

    const {
      cedula,
      telefono,
      parentesco,
    } = req.body;

    const cedulaNormalizada = String(
      cedula || ""
    ).trim();

    if (
      !cedulaNormalizada ||
      !telefono ||
      !parentesco
    ) {
      return res.status(400).json({
        error:
          "Cédula, teléfono y parentesco son obligatorios",
      });
    }

    const usuario = await Usuario.findById(
      userId
    );

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const cedulaOcupada =
      await Usuario.findOne({
        _id: {
          $ne: usuario._id,
        },
        cedula: cedulaNormalizada,
        rol: "familiar",
      });

    if (cedulaOcupada) {
      return res.status(400).json({
        error:
          "Ya existe otra cuenta familiar con esa cédula",
      });
    }

    usuario.cedula = cedulaNormalizada;
    usuario.telefono = String(
      telefono
    ).trim();

    usuario.parentesco = String(
      parentesco
    ).trim();

    usuario.perfilCompleto = true;

    await usuario.save();

    const idsPacientes =
      await asociarPacientes(usuario);

    res.json({
      mensaje:
        idsPacientes.length > 0
          ? "Perfil completado y pacientes asociados correctamente"
          : "Perfil completado. No se encontraron pacientes asociados.",
      token: generarToken(usuario),
      usuario: datosUsuario(usuario),
    });
  } catch (error) {
    console.error(
      "Error completando perfil Google:",
      error
    );

    res.status(500).json({
      error:
        "Error en el servidor: " +
        error.message,
    });
  }
};

// OBTENER PERFIL
const obtenerPerfil = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const usuario = await Usuario.findById(
      userId
    ).select(
      "nombre email rol telefono cedula parentesco authProvider perfilCompleto emailVerificado"
    );

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json({
      usuario: datosUsuario(usuario),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// ACTUALIZAR PERFIL
const actualizarPerfil = async (
  req,
  res
) => {
  try {
    const userId = req.usuario.id;

    const {
      nombre,
      telefono,
      parentesco,
    } = req.body;

    const usuario = await Usuario.findById(
      userId
    );

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (nombre !== undefined) {
      usuario.nombre = String(nombre).trim();
    }

    if (telefono !== undefined) {
      usuario.telefono = String(
        telefono
      ).trim();
    }

    if (parentesco !== undefined) {
      usuario.parentesco = String(
        parentesco
      ).trim();
    }

    await usuario.save();

    res.json({
      mensaje:
        "Perfil actualizado correctamente",
      usuario: datosUsuario(usuario),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// CAMBIAR CONTRASEÑA
const cambiarPassword = async (
  req,
  res
) => {
  try {
    const userId = req.usuario.id;

    const {
      passwordActual,
      nuevaPassword,
    } = req.body;

    if (
      !passwordActual ||
      !nuevaPassword
    ) {
      return res.status(400).json({
        error:
          "La contraseña actual y la nueva son obligatorias",
      });
    }

    if (
      String(nuevaPassword).length < 6
    ) {
      return res.status(400).json({
        error:
          "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const usuario = await Usuario.findById(
      userId
    );

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (!usuario.password) {
      return res.status(400).json({
        error:
          "Esta cuenta utiliza inicio de sesión con Google y no tiene contraseña local",
      });
    }

    const coincide = await bcrypt.compare(
      passwordActual,
      usuario.password
    );

    if (!coincide) {
      return res.status(400).json({
        error:
          "Contraseña actual incorrecta",
      });
    }

    usuario.password = await bcrypt.hash(
      nuevaPassword,
      10
    );

    await usuario.save();

    res.json({
      mensaje:
        "Contraseña actualizada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// SOLICITAR RECUPERACIÓN
const solicitarRecuperacion = async (
  req,
  res
) => {
  try {
    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const respuestaGenerica = {
      mensaje:
        "Si el correo existe y admite recuperación, recibirás un enlace para restablecer la contraseña.",
    };

    if (!email) {
      return res.status(400).json({
        error: "El correo es obligatorio",
      });
    }

    const usuario = await Usuario.findOne({
      email,
    });

    if (!usuario || !usuario.password) {
      return res.json(respuestaGenerica);
    }

    const tokenPlano =
      crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(tokenPlano)
      .digest("hex");

    usuario.resetPasswordToken =
      tokenHash;

    usuario.resetPasswordExpires =
      new Date(Date.now() + 30 * 60 * 1000);

    await usuario.save();

    const frontendUrl = String(
      process.env.FRONTEND_URL || ""
    ).replace(/\/$/, "");

    const enlace =
      `${frontendUrl}/restablecer-password/${tokenPlano}`;

    const transporter =
      nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(
          process.env.EMAIL_PORT || 587
        ),
        secure:
          String(
            process.env.EMAIL_SECURE
          ).toLowerCase() === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER,
      to: usuario.email,
      subject:
        "Restablecer contraseña",
      text:
        `Abre este enlace para crear una nueva contraseña: ${enlace}. ` +
        "El enlace vence en 30 minutos.",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Restablecer contraseña</h2>
          <p>Recibimos una solicitud para cambiar tu contraseña.</p>
          <p>
            <a href="${enlace}">
              Crear nueva contraseña
            </a>
          </p>
          <p>Este enlace vence en 30 minutos.</p>
          <p>Si no realizaste esta solicitud, ignora este mensaje.</p>
        </div>
      `,
    });

    res.json(respuestaGenerica);
  } catch (error) {
    console.error(
      "Error enviando recuperación:",
      error
    );

    res.status(500).json({
      error:
        "No se pudo enviar el correo de recuperación",
    });
  }
};

// RESTABLECER CONTRASEÑA
const restablecerPassword = async (
  req,
  res
) => {
  try {
    const tokenPlano = String(
      req.params.token || ""
    ).trim();

    const nuevaPassword = String(
      req.body.nuevaPassword || ""
    );

    if (!tokenPlano || !nuevaPassword) {
      return res.status(400).json({
        error:
          "Token y nueva contraseña son obligatorios",
      });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({
        error:
          "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(tokenPlano)
      .digest("hex");

    const usuario = await Usuario.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!usuario) {
      return res.status(400).json({
        error:
          "El enlace es inválido o ya venció",
      });
    }

    usuario.password = await bcrypt.hash(
      nuevaPassword,
      10
    );

    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;

    await usuario.save();

    res.json({
      mensaje:
        "Contraseña restablecida correctamente",
    });
  } catch (error) {
    console.error(
      "Error restableciendo contraseña:",
      error
    );

    res.status(500).json({
      error:
        "No se pudo restablecer la contraseña",
    });
  }
};

module.exports = {
  registrar,
  login,
  loginGoogle,
  completarPerfilGoogle,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  solicitarRecuperacion,
  restablecerPassword,
};
