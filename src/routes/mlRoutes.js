const express = require("express");
const router = express.Router();
const Medicion = require("../models/medicion");
const axios = require("axios");

router.post("/predict/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const medicion = await Medicion.findById(id);

    if (!medicion) {
      return res.status(404).json({ error: "Medición no encontrada" });
    }

    // llamada a Flask
    const response = await axios.post("http://127.0.0.1:5001/predict", {
      features: medicion.audio_fft
    });

    medicion.resultado = {
      tipo: response.data.prediccion,
      confianza: response.data.confianza
    };

    await medicion.save();

    res.json({
      mensaje: "Diagnóstico actualizado",
      resultado: medicion.resultado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error llamando a ML" });
  }
});

module.exports = router;
