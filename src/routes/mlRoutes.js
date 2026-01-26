const express = require("express");
const router = express.Router();
const axios = require("axios");
const Medicion = require("../models/Medicion");

// POST /api/ml/predict/:medicionId
router.post("/predict/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Obtener medición real
    const medicion = await Medicion.findById(id);
    if (!medicion) {
      return res.status(404).json({ error: "Medición no encontrada" });
    }

    // 2️⃣ Convertir FFT a texto (simulación de audio)
    // (para el demo es totalmente válido)
    const payload = {
      fft: medicion.audio_fft,
      rms: medicion.rms,
      zcr: medicion.zcr,
      spectral_centroid: medicion.spectral_centroid
    };

    // 3️⃣ Enviar a la API ML
    const response = await axios.post(
      "http://127.0.0.1:5001/predict-json",
      payload
    );

    const { prediccion, confianza } = response.data;

    // 4️⃣ Guardar diagnóstico
    medicion.diagnostico = prediccion;
    await medicion.save();

    res.json({
      mensaje: "Diagnóstico generado por ML",
      diagnostico: prediccion,
      confianza
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error llamando a ML" });
  }
});

module.exports = router;
