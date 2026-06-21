const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const verificarRol = require("../middleware/verificarRol");
const Usuario = require("../models/Usuario");
const Paciente = require("../models/Paciente");
const usuarioController = require("../controllers/usuarioController");
const bcrypt = require("bcryptjs");

router.use(authMiddleware);
console.log(">>> usuarioRoutes cargado <<<");


// OBTENER LOS PACIENTES DEL FAMILIAR LOGUEADO
router.get("/mis-pacientes", async (req, res) => {
  try {
    const userId = req.usuario.id;

    const usuario = await Usuario.findById(userId);

    if (!usuario || usuario.rol !== "familiar") {
      return res.status(403).json({ error: "Solo familiares pueden acceder." });
    }

    const pacientes = await Paciente.find({
      _id: { $in: usuario.pacientes },
    });

    res.json(pacientes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error obteniendo pacientes del familiar" });
  }
});

// 
// ASOCIAR PACIENTE A UN FAMILIAR
router.post("/asociar-paciente", usuarioController.asociarPaciente);


// ADMIN - RESUMEN
router.get("/admin/resumen", verificarRol("admin"), usuarioController.adminResumen);


// ADMIN - LISTAR USUARIOS
router.get("/admin/usuarios", verificarRol("admin"), usuarioController.listarUsuariosAdmin);


// ADMIN - OBTENER UN USUARIO
router.get("/admin/usuarios/:id", verificarRol("admin"), usuarioController.obtenerUsuarioAdmin);


// ADMIN - CREAR USUARIO
router.post("/admin/crear-usuario", verificarRol("admin"), usuarioController.crearUsuarioAdmin);


// ADMIN - EDITAR USUARIO
router.put("/admin/usuarios/:id", verificarRol("admin"), usuarioController.actualizarUsuarioAdmin);


// ADMIN - ELIMINAR USUARIO
router.delete("/admin/usuarios/:id", verificarRol("admin"), usuarioController.eliminarUsuarioAdmin);


// ADMIN - GENERAR CONTRASEÑA TEMPORAL
router.put(
  "/admin/usuarios/:id/restablecer-password",
  verificarRol("admin"),
  usuarioController.restablecerPasswordAdmin
);


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

router.get("/test-auth", (req, res) => {
  res.json({
    mensaje: "Token recibido",
    user: req.usuario,
  });
});

module.exports = router;