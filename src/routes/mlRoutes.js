const express = require("express");
const axios = require("axios");
const Medicion = require("../models/medicion");

const router = express.Router(); 

// POST /api/ml/predict/:id
router.post("/predict/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️ Buscar la medición
    const medicion = await Medicion.findById(id);
    if (!medicion) {
      return res.status(404).json({ error: "Medición no encontrada" });
    }

    // 2️ Construir vector de features (IGUAL que el entrenamiento)
    const features = [
      ...medicion.audio_fft,
      medicion.rms,
      medicion.zcr,
      medicion.centroide_espectral
    ];

    // 3️ Llamar a la API ML (Flask)
    const response = await axios.post(
      "http://127.0.0.1:5001/predict-features",
      { features }
    );

    // 4️ Guardar resultado en MongoDB
    medicion.resultado = {
      tipo: response.data.prediccion,
      confianza: response.data.confianza
    };

    await medicion.save();

    // 5️ Responder
    res.json(medicion.resultado);

  } catch (error) {
    console.error(" Error ML:", error.message);
    res.status(500).json({ error: "Error llamando a ML" });
  }
});

module.exports = router;
