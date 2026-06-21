const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");

const listarFamiliares = async (req, res) => {
  try {
    const medicoId = req.usuario.id;
    const rol = req.usuario.rol;

    const familiaresReales = await Usuario.find({ rol: "familiar" }).select(
      "nombre email cedula parentesco telefono pacientes"
    );

    // Si no es médico/admin, solo devuelve usuarios familiares reales
    if (rol !== "medico" && rol !== "admin") {
      return res.json(familiaresReales);
    }

    // Traer pacientes del médico con su responsable
    const pacientes = await Paciente.find({ medico: medicoId }).select(
      "responsable"
    );

    const pendientes = [];
    const clavesPendientes = new Set();

    for (const p of pacientes) {
      const r = p.responsable;
      if (!r?.nombre) continue;

      const yaExiste = familiaresReales.some((f) => {
        const mismaCedula =
          r.cedula && f.cedula && String(r.cedula) === String(f.cedula);

        const mismoCorreo =
          r.correo &&
          f.email &&
          String(r.correo).toLowerCase() === String(f.email).toLowerCase();

        return mismaCedula || mismoCorreo;
      });

      if (!yaExiste) {
        const clave =
          String(
            r.cedula ||
              r.correo ||
              r.nombre
          )
            .trim()
            .toLowerCase();

        if (!clavesPendientes.has(clave)) {
          clavesPendientes.add(clave);

          pendientes.push({
            _id: `pendiente-${clave}`,
            nombre: r.nombre,
            email: r.correo || "",
            cedula: r.cedula || "",
            parentesco:
              r.parentesco || "Responsable",
            telefono: r.telefono || "",
            pendiente: true,
            pacientes: [],
          });
        }
      }
    }

    res.json([...familiaresReales, ...pendientes]);
  } catch (e) {
    res.status(500).json({ error: "Error listando familiares: " + e.message });
  }
};

module.exports = { listarFamiliares };