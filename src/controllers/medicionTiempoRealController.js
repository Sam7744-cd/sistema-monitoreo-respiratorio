const MedicionTiempoReal = require("../models/zz_MedicionTiempoReal");

// Recibir medición del ESP32
exports.recibirMedicion = async (req, res) => {
  try {
    const medicion = await MedicionTiempoReal.create(req.body);
    res.json(medicion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error al guardar la medición" });
  }
};

// Última medición para la app (tiempo real)
exports.obtenerActual = async (req, res) => {
  try {
    const ultima = await MedicionTiempoReal.findOne().sort({ createdAt: -1 });

    if (!ultima) return res.json({ msg: "No hay datos aún" });

    res.json({
      movX: ultima.movX,
      movY: ultima.movY,
      movZ: ultima.movZ,
      ruido: ultima.ruido,
      diagnostico: ultima.diagnostico,
      alerta: ultima.alerta,
      timestamp: Math.floor(ultima.createdAt.getTime() / 1000)
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener datos" });
  }
};
