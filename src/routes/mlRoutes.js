const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const upload = multer({ storage: multer.memoryStorage() });

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5001";

// POST /api/ml/predict-audio
router.post("/predict-audio", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ningún archivo WAV" });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, req.file.originalname);

    const response = await axios.post(
      `${ML_API_URL}/predict-audio`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      }
    );

    return res.json({
      mensaje: "Predicción generada correctamente",
      prediccion: response.data.prediccion,
      confianza: response.data.confianza,
    });
  } catch (error) {
    console.error("Error en ML:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Error llamando a la API de Machine Learning",
      detalle: error.response?.data || error.message,
    });
  }
});

module.exports = router;