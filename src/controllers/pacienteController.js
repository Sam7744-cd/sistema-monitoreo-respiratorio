const Paciente = require("../models/Paciente");
const Usuario = require("../models/Usuario");


//  helper: calcular edad (años) desde fechaNacimiento
function calcEdadAnios(fechaNacimiento) {
  if (!fechaNacimiento) return 0;
  const n = new Date(fechaNacimiento);
  if (isNaN(n.getTime())) return 0;

  const hoy = new Date();
  let anios = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) anios--;
  if (anios < 0) anios = 0;
  return anios;
}


// CREAR PACIENTE 
const crearPaciente = async (req, res) => {
  try {
    const medicoId = req.usuario.id;
    const {
      nombres,
      apellidos,
      fechaNacimiento,
      responsable, // { nombre, cedula, telefono, correo, parentesco }
    } = req.body;

    const { nombre, cedula, edad, sexo, peso, direccion, telefono, correo } = req.body;

    // Cedula: puede venir como cedula del paciente
    const cedulaPaciente = String(cedula || req.body?.cedula || "").trim();

    // Nombre: puede venir (nombres+apellidos) o (nombre)
    const nombrePaciente =
      (String(nombres || "").trim() + " " + String(apellidos || "").trim()).trim() ||
      String(nombre || "").trim();

    // Sexo / dirección: pueden venir en ambos formatos
    const sexoPaciente = sexo || req.body?.sexo || "Femenino";
    const direccionPaciente = req.body?.direccion || "";

    // Validación mínima real
    if (!nombrePaciente || !cedulaPaciente) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios (nombre/nombres-apellidos, cédula)" });
    }

    // evitar duplicados por cédula
    const existe = await Paciente.findOne({ cedula: cedulaPaciente });
    if (existe) {
      return res.status(400).json({ error: "Ya existe un paciente con esa cédula" });
    }

    // Edad: si viene fechaNacimiento úsala, si no usa edad numérica
    const edadFinal = fechaNacimiento ? calcEdadAnios(fechaNacimiento) : Number(edad || 0);

    // Telefono/correo: si vienen en formato nuevo están en responsable
    const telFinal = responsable?.telefono || telefono || "";
    const correoFinal = responsable?.correo || correo || "";

  let familiarExistente = null;

  const coincidenciasFamiliar = [];

  if (responsable?.cedula) {
    coincidenciasFamiliar.push({
      cedula: String(responsable.cedula).trim(),
    });
  }

  if (responsable?.correo) {
    coincidenciasFamiliar.push({
      email: String(responsable.correo)
        .trim()
        .toLowerCase(),
    });
  }

  if (coincidenciasFamiliar.length > 0) {
    familiarExistente = await Usuario.findOne({
      rol: "familiar",
      $or: coincidenciasFamiliar,
    });
  }

    // Guardar
    const nuevo = new Paciente({
      // compatibilidad con tu schema actual:
      nombre: nombrePaciente,
      cedula: cedulaPaciente,
      edad: edadFinal,
      sexo: sexoPaciente,
      peso: peso || 0,
      direccion: direccionPaciente,
      telefono: telFinal,
      correo: correoFinal,

      // si tu schema tiene estos campos, se guardan; si no, Mongo igual los guarda:
      nombres: nombres || undefined,
      apellidos: apellidos || undefined,
      fechaNacimiento: fechaNacimiento || undefined,
      responsable: responsable || undefined,

      medico: medicoId,
      familiares: familiarExistente
      ? [familiarExistente._id]
      : [],
    });

    await nuevo.save();

    await Usuario.findByIdAndUpdate(medicoId, {
      $addToSet: {
        pacientes: nuevo._id,
      },
    });

    if (familiarExistente) {
      await Usuario.findByIdAndUpdate(
        familiarExistente._id,
        {
          $addToSet: {
            pacientes: nuevo._id,
          },
        }
      );
    }

    res.status(201).json({
      mensaje: familiarExistente
        ? "Paciente creado y familiar asociado correctamente"
        : "Paciente creado. El familiar se asociará cuando registre su cuenta.",
      paciente: nuevo,
    });
  } catch (error) {
    res.status(500).json({ error: "Error creando paciente: " + error.message });
  }
};

// OBTENER PACIENTES SEGÚN ROL
const obtenerPacientes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    let pacientes = [];

    if (rol === "medico") {
      pacientes = await Paciente.find({ medico: usuarioId }).sort({ createdAt: -1 });
    } else if (rol === "familiar") {
      pacientes = await Paciente.find({ familiares: usuarioId }).sort({ createdAt: -1 });
    } else {
      pacientes = await Paciente.find({}).sort({ createdAt: -1 });
    }

    res.json(pacientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pacientes: " + error.message });
  }
};

// OBTENER PACIENTE POR ID
const obtenerPaciente = async (req, res) => {
  try {
    const paciente = await Paciente.findById(req.params.id)
      .populate("medico", "nombre email")
      .populate("familiares", "nombre email telefono cedula parentesco");

    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    res.json({ paciente });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo paciente: " + error.message });
  }
};

// LISTAR ASOCIACIONES (para la tabla de arriba)
// GET /api/pacientes/asociaciones
const listarAsociaciones = async (req, res) => {
  try {
    const medicoId = req.usuario.id;

    const pacientes = await Paciente.find({ medico: medicoId })
      .select("nombre nombres apellidos cedula edad sexo fechaNacimiento responsable familiares")
      .populate("familiares", "nombre cedula parentesco telefono email");

    const filas = [];

    for (const p of pacientes) {
      const pNombre =
        (p.nombres || p.apellidos)
          ? `${p.nombres || ""} ${p.apellidos || ""}`.trim()
          : p.nombre || "Paciente";

      // 1) familiares realmente asociados
      if (Array.isArray(p.familiares) && p.familiares.length > 0) {
        for (const f of p.familiares) {
          filas.push({
            pacienteId: p._id,
            pacienteNombre: pNombre,
            pacienteCedula: p.cedula || "",
            familiarId: f._id,
            familiarNombre: f.nombre || "",
            familiarCedula: f.cedula || "",
            parentesco: f.parentesco || "Familiar",
            telefono: f.telefono || "",
            tipo: "asociado",
          });
        }
      }

      // 2) si no hay familiar asociado, pero sí responsable guardado
      if ((!p.familiares || p.familiares.length === 0) && p.responsable?.nombre) {
        filas.push({
          pacienteId: p._id,
          pacienteNombre: pNombre,
          pacienteCedula: p.cedula || "",
          familiarId: null,
          familiarNombre: p.responsable.nombre || "",
          familiarCedula: p.responsable.cedula || "",
          parentesco: p.responsable.parentesco || "Responsable",
          telefono: p.responsable.telefono || "",
          tipo: "responsable",
        });
      }
    }

    res.json(filas);
  } catch (e) {
    res.status(500).json({ error: "Error listando asociaciones: " + e.message });
  }
};

// =====================
// ASOCIAR FAMILIAR (por ID)
// POST /api/pacientes/:pacienteId/familiares { familiarId }
// =====================
const agregarFamiliar = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const { familiarId } = req.body;

    if (!familiarId) {
      return res.status(400).json({ error: "familiarId es obligatorio" });
    }

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const familiar = await Usuario.findById(familiarId);
    if (!familiar || familiar.rol !== "familiar") {
      return res.status(400).json({ error: 'Debe ser un usuario con rol "familiar"' });
    }

    await Paciente.findByIdAndUpdate(
      pacienteId,
      { $addToSet: { familiares: familiarId } },
      { new: true }
    );

    await Usuario.findByIdAndUpdate(
      familiarId,
      { $addToSet: { pacientes: pacienteId } },
      { new: true }
    );

    res.json({ mensaje: "Familiar asociado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error asociando familiar: " + error.message });
  }
};

// DESVINCULAR FAMILIAR
// DELETE /api/pacientes/:pacienteId/familiares/:familiarId
const quitarFamiliar = async (req, res) => {
  try {
    const { pacienteId, familiarId } = req.params;

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }

    const familiar = await Usuario.findById(familiarId);
    if (!familiar) {
      return res.status(404).json({ error: "Familiar no encontrado" });
    }

    //  quitar sin disparar validación completa del schema
    await Paciente.findByIdAndUpdate(
      pacienteId,
      { $pull: { familiares: familiarId } },
      { new: true }
    );

    await Usuario.findByIdAndUpdate(
      familiarId,
      { $pull: { pacientes: pacienteId } },
      { new: true }
    );

    res.json({ mensaje: "Familiar desvinculado correctamente" });
  } catch (e) {
    res.status(500).json({ error: "Error desvinculando: " + e.message });
  }
};

// ACTUALIZAR PACIENTE 
const actualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findById(id);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    // compat + nuevo
    if (req.body.nombres !== undefined) paciente.nombres = req.body.nombres;
    if (req.body.apellidos !== undefined) paciente.apellidos = req.body.apellidos;

    if (req.body.nombre !== undefined) paciente.nombre = req.body.nombre;
    if (req.body.cedula !== undefined) paciente.cedula = req.body.cedula;

    if (req.body.fechaNacimiento !== undefined) {
      paciente.fechaNacimiento = req.body.fechaNacimiento ? new Date(req.body.fechaNacimiento) : undefined;
      paciente.edad = req.body.fechaNacimiento ? calcEdadAnios(req.body.fechaNacimiento) : paciente.edad;
    }

    if (req.body.edad !== undefined) paciente.edad = req.body.edad;
    if (req.body.sexo !== undefined) paciente.sexo = req.body.sexo;
    if (req.body.peso !== undefined) paciente.peso = req.body.peso;
    if (req.body.direccion !== undefined) paciente.direccion = req.body.direccion;
    if (req.body.telefono !== undefined) paciente.telefono = req.body.telefono;
    if (req.body.correo !== undefined) paciente.correo = req.body.correo;

    if (req.body.alergias !== undefined) paciente.alergias = req.body.alergias;
    if (req.body.observaciones !== undefined) paciente.observaciones = req.body.observaciones;

    if (req.body.responsable !== undefined) paciente.responsable = req.body.responsable;

    await paciente.save();

    res.json({ mensaje: "Paciente actualizado correctamente", paciente });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// =====================
// ELIMINAR PACIENTE
// =====================
const eliminarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Paciente.findById(id);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    // quitar del médico
    if (paciente.medico) {
      await Usuario.findByIdAndUpdate(paciente.medico, {
        $pull: { pacientes: paciente._id },
      });
    }

    // quitar de familiares asociados
    if (paciente.familiares && paciente.familiares.length > 0) {
      await Usuario.updateMany(
        { _id: { $in: paciente.familiares } },
        { $pull: { pacientes: paciente._id } }
      );
    }

    await Paciente.findByIdAndDelete(id);

    res.json({ mensaje: "Paciente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando paciente: " + error.message });
  }
};

// DELETE /api/pacientes/:pacienteId/familiares/:familiarId
const desvincularFamiliar = async (req, res) => {
  try {
    const { pacienteId, familiarId } = req.params;

    const paciente = await Paciente.findById(pacienteId);
    if (!paciente) return res.status(404).json({ error: "Paciente no encontrado" });

    // quitar familiar del paciente
    paciente.familiares = (paciente.familiares || []).filter(
      (id) => String(id) !== String(familiarId)
    );
    await paciente.save();

    // quitar paciente del familiar
    await Usuario.findByIdAndUpdate(familiarId, {
      $pull: { pacientes: paciente._id },
    });

    res.json({ mensaje: "Asociación eliminada correctamente" });
  } catch (e) {
    res.status(500).json({ error: "Error desvinculando: " + e.message });
  }
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
  obtenerPaciente,
  listarAsociaciones,
  desvincularFamiliar,
  agregarFamiliar,
  quitarFamiliar,
  actualizarPaciente,
  eliminarPaciente,
};