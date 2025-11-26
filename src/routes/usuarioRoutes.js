const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");

router.use(authMiddleware);

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

module.exports = router;
