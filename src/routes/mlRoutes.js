const axios = require("axios");
const Medicion = require("../models/medicion");

router.post("/predict/:id", async (req, res) => {
  try {
    const medicion = await Medicion.findById(req.params.id);
    if (!medicion) {
      return res.status(404).json({ error: "Medición no encontrada" });
    }

    const features = [
      ...medicion.audio_fft,
      medicion.rms,
      medicion.zcr,
      medicion.centroide_espectral
    ];

    const response = await axios.post(
      "http://127.0.0.1:5001/predict-features",
      { features }
    );

    medicion.resultado = {
      tipo: response.data.prediccion,
      confianza: response.data.confianza
    };

    await medicion.save();

    res.json(medicion.resultado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error llamando a ML" });
  }
});
