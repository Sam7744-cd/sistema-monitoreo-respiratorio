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

module.exports = router;

router.get("/test-auth", (req, res) => {
  res.json({
    mensaje: "Token recibido",
    user: req.usuario
  });
});
