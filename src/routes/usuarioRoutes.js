const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const usuarioController = require("../controllers/usuarioController");
const verificarRol = require("../middleware/verificarRol");

router.use(authMiddleware);
console.log(">>> usuarioRoutes cargado <<<");
// -----------------------------------------
// OBTENER LOS PACIENTES DEL FAMILIAR LOGUEADO
// -----------------------------------------
router.get("/mis-pacientes", async (req, res) => {
  try {
    const userId = req.usuario.id;

    const usuario = await Usuario.findById(userId);

    if (!usuario || usuario.rol !== "familiar") {
      return res.status(403).json({ error: "Solo familiares pueden acceder." });
    }

    const pacientes = await Paciente.find({
      _id: { $in: usuario.pacientes }
    });

    res.json(pacientes);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error obteniendo pacientes del familiar" });
  }
});
// -----------------------------------------
// ASOCIAR PACIENTE A UN FAMILIAR (MEDICO)
// -----------------------------------------
router.post(
  "/asociar-paciente",
  authMiddleware,
  usuarioController.asociarPaciente
);

const bcrypt = require("bcryptjs");

// CAMBIAR CONTRASEÑA
router.put("/cambiar-password", async (req, res) => {
  try {
    const { actual, nueva } = req.body;

    if (!actual || !nueva) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const coincide = await bcrypt.compare(actual, usuario.password);

    if (!coincide) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(nueva, salt);

    await usuario.save();

    res.json({ message: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cambiando contraseña" });
  }
});


module.exports = router;

router.get("/test-auth", (req, res) => {
  res.json({
    mensaje: "Token recibido",
    user: req.usuario
  });
});
