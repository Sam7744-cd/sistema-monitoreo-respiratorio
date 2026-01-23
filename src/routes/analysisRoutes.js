// Manejo del análisis de archivos de audio enviados por el dispositivo

const express = require('express');
const multer = require('multer');
const router = express.Router();

// Importación de la lógica de análisis y modelo de medición
const classifier = require('../analysis/classifier');
const AudioProcessor = require('../analysis/audioProcessor');
const Medicion = require('../models/medicion'); // Modelo para guardar los resultados

// Configuro multer para poder recibir archivos desde Postman o desde la app móvil
const upload = multer({ storage: multer.memoryStorage() });

// Ruta básica de prueba para verificar que el módulo de análisis está funcionando
router.get('/test', (req, res) => {
  res.json({ mensaje: '¡Ruta de análisis funcionando correctamente!' });
});

// Ruta principal que recibe un archivo de audio .wav, lo analiza y guarda el resultado
router.post('/detect-file', upload.single('file'), async (req, res) => {
  try {
    // Verifica si se recibió archivo
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Archivo no recibido' });
    }

    // Obtengo el buffer del archivo de audio enviado
    const audioBuffer = req.file.buffer;

    // Extraigo características respiratorias como sibilancias, roncus, etc.
    const features = await AudioProcessor.extraerCaracteristicas(audioBuffer);

    // Clasifico el audio usando reglas que yo definí (heurísticas simples)
    const resultado = classifier.clasificar(features);

    // Opcional: podría guardar el resultado en MongoDB usando el modelo Medicion
    // Aquí no se está haciendo en este archivo, pero puede agregarse si se desea

    // Devuelvo al frontend (o Postman) los datos analizados y el diagnóstico
    res.json({
      exito: true,
      mensaje: 'Audio analizado correctamente',
      datos: features,
      resultado: resultado
    });

  } catch (error) {
    console.error(' Error al analizar archivo .wav:', error);
    res.status(500).json({
      error: 'Error al analizar el audio: ' + error.message
    });
  }
});

module.exports = router;
